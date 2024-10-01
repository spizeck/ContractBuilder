import {db} from '../../firebase';
import {addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where,} from "firebase/firestore";
import {RoomType} from "@/types";

export async function getRoomTypes(hotelId: string): Promise<RoomType[]> {
  const q = query(collection(db, "roomTypes"), where("hotelId", "==", hotelId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<RoomType, "id">),
  }));
}

export async function addRoomType(roomTypeData: Omit<RoomType, "id">): Promise<string> {
  const docRef = await addDoc(collection(db, "roomTypes"), roomTypeData);
  return docRef.id;
}

export async function updateRoomType(roomTypeId: string, roomTypeData: Partial<RoomType>): Promise<void> {
  const docRef = doc(db, "roomTypes", roomTypeId);
  await updateDoc(docRef, roomTypeData);
}

export async function deleteRoomType(roomTypeId: string): Promise<void> {
  const docRef = doc(db, "roomTypes", roomTypeId);
  await deleteDoc(docRef);
}