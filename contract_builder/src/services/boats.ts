// src/services/boats.ts
import {db} from "@/lib/firebase";
import {addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc,} from "firebase/firestore";
import {Boat} from "@/types/diveLogTypes";

const boatsCollection = collection(db, "boats");

export async function getBoats(): Promise<Boat[]> {
  const snapshot = await getDocs(boatsCollection);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Boat[];
}

export async function addBoat(data: Omit<Boat, "id" | "createdAt">) {
  return await addDoc(boatsCollection, {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function updateBoat(id: string, data: Partial<Boat>) {
  const ref = doc(db, "boats", id);
  return await updateDoc(ref, data);
}

export async function deleteBoat(id: string) {
  const ref = doc(db, "boats", id);
  return await deleteDoc(ref);
}
