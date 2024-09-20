import { db } from "../../firebase";
import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDoc,
} from "firebase/firestore";

export interface Rate {
  id: string;
  hotelId: string;
  categoryId: string;
  seasonId: string;
  occupancyType: string;
  price: number;
}

export async function getRates(hotelId: string): Promise<Rate[]> {
  const ratesRef = collection(db, "rates");
  const q = query(ratesRef, where("hotelId", "==", hotelId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Rate, "id">),
  }));
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