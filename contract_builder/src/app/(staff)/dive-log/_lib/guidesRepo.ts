import {db} from "@core/db/firebase";
import {addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where} from "firebase/firestore";
import {Guide} from "../_types";

const guidesCollection = collection(db, "guides");

export async function getGuides(activeOnly = false): Promise<Guide[]> {
  let snap;
  if (activeOnly) {
    const q = query(guidesCollection, where("active", "==", true));
    snap = await getDocs(q);
  } else {
    snap = await getDocs(guidesCollection);
  }
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
