// services/rateSync.ts
import {db} from "../lib/firebase";
import {addDoc, collection, getDocs, query, where,} from "firebase/firestore";
import type {Rate, RoomCategory, Season} from "@/types";

export async function ensureRatesForCategory(
  hotelId: string,
  category: Pick<RoomCategory, "id" | "occupancyTypes">
) {
  // 1. Load all seasons for this hotel
  const seasonsRef = collection(db, "seasons");
  const seasonsQ = query(seasonsRef, where("hotelId", "==", hotelId));
  const seasonsSnap = await getDocs(seasonsQ);

  if (seasonsSnap.empty) return;

  const ratesRef = collection(db, "rates");

  // 2. For each season × occupancyType, ensure a Rate exists
  for (const seasonDoc of seasonsSnap.docs) {
    const seasonId = seasonDoc.id;
    const season = seasonDoc.data() as Season;

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
        console.log(
          `Creating missing rate → season ${season.name} (${seasonId}), occupancy ${occupancyType}`
        );

        const newRate: Omit<Rate, "id"> = {
          hotelId,
          categoryId: category.id,
          seasonId,
          occupancyType,
          price: 0, // placeholder until updated
        };

        await addDoc(ratesRef, newRate);
      } else {
        console.log(
          `Rate already exists → season ${season.name}, occupancy ${occupancyType}`
        );
      }
    }
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