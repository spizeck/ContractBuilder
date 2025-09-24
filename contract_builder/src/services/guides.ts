import {db} from "@/lib/firebase";
import {addDoc, collection, deleteDoc, doc, getDocs, updateDoc,} from "firebase/firestore";
import {Guide} from "@/types/diveLogTypes";

const guidesCollection = collection(db, "guides");

export async function getGuides(): Promise<Guide[]> {
  const snap = await getDocs(guidesCollection);
  return snap.docs.map((d) => ({id: d.id, ...d.data()} as Guide));
}

export async function addGuide(data: Omit<Guide, "id">) {
  return await addDoc(guidesCollection, data);
}

export async function updateGuide(id: string, data: Partial<Guide>) {
  return await updateDoc(doc(db, "guides", id), data);
}

export async function deleteGuide(id: string) {
  return await deleteDoc(doc(db, "guides", id));
}
