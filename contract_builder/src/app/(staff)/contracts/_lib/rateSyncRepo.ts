// services/rateSync.ts
import {db} from "@core/db/firebase";
import {addDoc, collection, deleteDoc, doc, getDocs, query, where,} from "firebase/firestore";
import type {Rate, RoomCategory, Season} from "../_types";

export async function ensureRatesForCategory(
  hotelId: string,
  category: Pick<RoomCategory, "id" | "occupancyTypes">
) {
  // 1. Load all seasons for this hotel (single query)
  const seasonsRef = collection(db, "seasons");
  const seasonsSnap = await getDocs(query(seasonsRef, where("hotelId", "==", hotelId)));
  if (seasonsSnap.empty) return;

  const ratesRef = collection(db, "rates");

  // 2. Fetch ALL existing rates for this category in one query, then work in memory.
  //    This avoids the race condition where two concurrent calls both see empty and both insert.
  const allExistingSnap = await getDocs(
    query(
      ratesRef,
      where("hotelId", "==", hotelId),
      where("categoryId", "==", category.id)
    )
  );

  // Index existing rates by "seasonId|occupancyType" → array of docs (may have duplicates)
  const ratesByKey = new Map<string, { id: string; price: number }[]>();
  for (const rateDoc of allExistingSnap.docs) {
    const data = rateDoc.data() as Omit<Rate, "id">;
    const key = `${data.seasonId}|${data.occupancyType}`;
    if (!ratesByKey.has(key)) ratesByKey.set(key, []);
    ratesByKey.get(key)!.push({ id: rateDoc.id, price: data.price ?? 0 });
  }

  // 3. Deduplicate: for any key that has >1 doc, keep the one with the highest price
  //    (preserves real rate values over the 0-placeholder), delete the rest.
  const deletePromises: Promise<void>[] = [];
  for (const [, docs] of ratesByKey) {
    if (docs.length > 1) {
      // Sort descending by price so index 0 is the keeper
      docs.sort((a, b) => b.price - a.price);
      const [, ...extras] = docs;
      for (const extra of extras) {
        deletePromises.push(deleteDoc(doc(db, "rates", extra.id)));
      }
    }
  }
  if (deletePromises.length > 0) {
    await Promise.all(deletePromises);
  }

  // 4. Build the set of keys that now exist (one per key after dedup)
  const existingKeys = new Set(ratesByKey.keys());

  // 5. For each season × occupancyType in the desired set, insert only if absent
  const seasonNames = new Map(seasonsSnap.docs.map(d => [d.id, (d.data() as Season).name]));
  const insertPromises: Promise<void>[] = [];

  for (const seasonDoc of seasonsSnap.docs) {
    const seasonId = seasonDoc.id;

    for (const occupancyType of category.occupancyTypes) {
      const key = `${seasonId}|${occupancyType}`;
      if (!existingKeys.has(key)) {
        const newRate: Omit<Rate, "id"> = {
          hotelId,
          categoryId: category.id,
          seasonId,
          occupancyType,
          price: 0,
        };
        insertPromises.push(
          addDoc(ratesRef, newRate).then(() => {
            console.log(
              `Created missing rate → season ${seasonNames.get(seasonId)} (${seasonId}), occupancy ${occupancyType}`
            );
          })
        );
        // Mark key as present so a second iteration wouldn't re-insert
        existingKeys.add(key);
      }
    }
  }

  if (insertPromises.length > 0) {
    await Promise.all(insertPromises);
  }
}

/**
 * Clean up stale rate records when occupancy types are removed from a room category.
 * Deletes rate documents whose occupancyType is no longer in the category's allowed list.
 *
 * @param hotelId - The hotel ID
 * @param categoryId - The room category ID being edited
 * @param previousOccupancyTypes - The occupancy types before the edit
 * @param currentOccupancyTypes - The occupancy types after the edit
 * @returns The number of stale rate records deleted
 */
export async function cleanupStaleRatesForCategory(
  hotelId: string,
  categoryId: string,
  previousOccupancyTypes: string[],
  currentOccupancyTypes: string[]
): Promise<number> {
  const removedTypes = previousOccupancyTypes.filter(
    (t) => !currentOccupancyTypes.includes(t)
  );

  console.log('[RateSync] cleanupStaleRatesForCategory');
  console.log('[RateSync]   Previous occupancy types: %O', previousOccupancyTypes);
  console.log('[RateSync]   Current occupancy types: %O', currentOccupancyTypes);
  console.log('[RateSync]   Removed occupancy types: %O', removedTypes);

  if (removedTypes.length === 0) {
    console.log('[RateSync]   No occupancy types removed — nothing to clean up.');
    return 0;
  }

  // Query all rates for this category in this hotel
  const ratesRef = collection(db, "rates");
  const ratesSnap = await getDocs(
    query(
      ratesRef,
      where("hotelId", "==", hotelId),
      where("categoryId", "==", categoryId)
    )
  );

  // Find rates with occupancy types that were removed
  const staleDocs = ratesSnap.docs.filter((rateDoc) => {
    const data = rateDoc.data() as Omit<Rate, "id">;
    return removedTypes.includes(data.occupancyType);
  });

  if (staleDocs.length === 0) {
    console.log('[RateSync]   No stale rate records found.');
    return 0;
  }

  // Delete stale rate records
  const deletePromises = staleDocs.map((rateDoc) =>
    deleteDoc(doc(db, "rates", rateDoc.id))
  );
  await Promise.all(deletePromises);

  console.log('[RateSync]   Deleted %d stale rate record(s) for removed occupancy types: %O',
    staleDocs.length, removedTypes);

  return staleDocs.length;
}

export async function ensureRatesForSeason(
  hotelId: string,
  seasonId: string
) {
  // 1. Get all categories for this hotel
  const categoriesRef = collection(db, "roomCategories");
  const catQ = query(categoriesRef, where("hotelId", "==", hotelId));
  const catSnap = await getDocs(catQ);

  if (catSnap.empty) return;

  const ratesRef = collection(db, "rates");

  // 2. For each category × occupancyType, ensure a Rate exists
  for (const catDoc of catSnap.docs) {
    const category = {id: catDoc.id, ...(catDoc.data() as Omit<RoomCategory, "id">)};

    for (const occupancyType of category.occupancyTypes) {
      const existingQ = query(
        ratesRef,
        where("hotelId", "==", hotelId),
        where("categoryId", "==", category.id),
        where("seasonId", "==", seasonId),
        where("occupancyType", "==", occupancyType)
      );
      const existingSnap = await getDocs(existingQ);

      if (existingSnap.empty) {
        const newRate: Omit<Rate, "id"> = {
          hotelId,
          categoryId: category.id,
          seasonId,
          occupancyType,
          price: 0, // placeholder until updated
        };

        await addDoc(ratesRef, newRate);
        console.log(
          `Created missing rate → category ${category.name}, occupancy ${occupancyType}, season ${seasonId}`
        );
      }
    }
  }
}
