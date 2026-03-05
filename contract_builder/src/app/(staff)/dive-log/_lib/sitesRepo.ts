// src/app/app/dive-log/_lib/sitesRepo.ts
import {db} from "@core/db/firebase";
import {addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc,} from "firebase/firestore";
import {Site} from "../_types";

const sitesCollection = collection(db, "sites");

export async function getSites(): Promise<Site[]> {
  const snapshot = await getDocs(sitesCollection);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Site[];
}

export async function addSite(data: Omit<Site, "id">) {
  return await addDoc(sitesCollection, {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function updateSite(id: string, data: Partial<Site>) {
  const ref = doc(db, "sites", id);
  return await updateDoc(ref, data);
}

export async function deleteSite(id: string) {
  const ref = doc(db, "sites", id);
  return await deleteDoc(ref);
}
