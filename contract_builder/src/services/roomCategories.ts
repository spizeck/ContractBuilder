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
} from "firebase/firestore";

export interface RoomCategory {
  id: string;
  hotelId: string;
  name: string;
  occupancyTypes: string[]; // e.g., ["Single", "Double", "Triple", "Quad"]
}

export async function getRoomCategories(hotelId: string): Promise<RoomCategory[]> {
  const q = query(collection(db, "roomCategories"), where("hotelId", "==", hotelId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<RoomCategory, "id">),
  }));
}

export async function addRoomCategory(categoryData: Omit<RoomCategory, "id">): Promise<string> {
  const docRef = await addDoc(collection(db, "roomCategories"), categoryData);
  return docRef.id;
}

export async function updateRoomCategory(categoryId: string, categoryData: Partial<RoomCategory>): Promise<void> {
  const docRef = doc(db, "roomCategories", categoryId);
  await updateDoc(docRef, categoryData);
}

export async function deleteRoomCategory(categoryId: string): Promise<void> {
  const docRef = doc(db, "roomCategories", categoryId);
  await deleteDoc(docRef);
}