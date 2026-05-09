import {db} from "@core/db/firebase";
import {addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where,} from "firebase/firestore";
import {Rate, RoomCategory} from "../_types";

export async function getRates(hotelId: string): Promise<Rate[]> {
  const ratesRef = collection(db, "rates");
  const q = query(ratesRef, where("hotelId", "==", hotelId));
  const querySnapshot = await getDocs(q);

  // Filter out archived rates (stale rates from removed occupancy types)
  const rates: Rate[] = querySnapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Rate, "id">),
    }))
    .filter((rate) => !rate.archived);

  // 🔹 Load categories for names
  const categoriesRef = collection(db, "roomCategories");
  const catQ = query(categoriesRef, where("hotelId", "==", hotelId));
  const catSnap = await getDocs(catQ);
  const categories: Record<string, RoomCategory> = {};
  catSnap.forEach((doc) => {
    categories[doc.id] = { id: doc.id, ...(doc.data() as Omit<RoomCategory, "id">) };
  });

  // 🔹 Define occupancy order
  const occupancyOrder = ["Single", "Double", "Triple", "Quad"];

  // 🔹 Sort rates by Category Name → Occupancy Type
  rates.sort((a, b) => {
    const catA = categories[a.categoryId]?.name || "";
    const catB = categories[b.categoryId]?.name || "";
    if (catA !== catB) return catA.localeCompare(catB);

    const occA = occupancyOrder.indexOf(a.occupancyType);
    const occB = occupancyOrder.indexOf(b.occupancyType);
    return occA - occB;
  });

  return rates;
}

export async function addRate(rateData: Omit<Rate, "id">): Promise<string> {
  // Check for existing rate
  const q = query(
    collection(db, "rates"),
    where("hotelId", "==", rateData.hotelId),
    where("categoryId", "==", rateData.categoryId),
    where("seasonId", "==", rateData.seasonId),
    where("occupancyType", "==", rateData.occupancyType)
  );
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    throw new Error("A rate for this combination already exists.");
  }
  // Add new rate
  const docRef = await addDoc(collection(db, "rates"), rateData);
  return docRef.id;
}

export async function updateRate(rateId: string, rateData: Partial<Rate>): Promise<void> {
  const rateRef = doc(db, "rates", rateId);
  await updateDoc(rateRef, rateData);
}

export async function deleteRate(rateId: string): Promise<void> {
  const rateRef = doc(db, "rates", rateId);
  await deleteDoc(rateRef);
}

export async function getRateById(rateId: string): Promise<Rate | null> {
  const rateRef = doc(db, "rates", rateId);
  const docSnap = await getDoc(rateRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...(docSnap.data() as Omit<Rate, "id">) };
  } else {
    return null;
  }
}
