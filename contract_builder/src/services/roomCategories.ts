import {db} from "../../firebase";
import {addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where,} from "firebase/firestore";
import {RoomCategory} from "@/types";

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