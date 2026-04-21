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
