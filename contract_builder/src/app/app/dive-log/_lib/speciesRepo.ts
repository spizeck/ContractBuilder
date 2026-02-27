// src/app/app/dive-log/_lib/speciesRepo.ts
import {db} from "@/lib/firebase";
import {addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc,} from "firebase/firestore";
import {Species} from "../_types";

const speciesCollection = collection(db, "species");

export async function getSpecies(): Promise<Species[]> {
  const snapshot = await getDocs(speciesCollection);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Species[];
}

export async function addSpecies(data: Omit<Species, "id">) {
  return await addDoc(speciesCollection, {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function updateSpecies(id: string, data: Partial<Species>) {
  const ref = doc(db, "species", id);
  return await updateDoc(ref, data);
}

export async function deleteSpecies(id: string) {
  const ref = doc(db, "species", id);
  return await deleteDoc(ref);
}
