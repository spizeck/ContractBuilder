// src/services/dives.ts
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { Dive } from "@/types/diveLogTypes";

const divesCollection = collection(db, "dives");

export async function getDives(): Promise<Dive[]> {
  const snapshot = await getDocs(divesCollection);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Dive[];
}

export async function addDive(data: Omit<Dive, "id">) {
  return await addDoc(divesCollection, {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function getDive(id: string): Promise<Dive | null> {
  const ref = doc(db, "dives", id);
  const snap = await getDoc(ref);
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Dive) : null;
}

export async function updateDive(id: string, data: Partial<Dive>) {
  const ref = doc(db, "dives", id);
  return await updateDoc(ref, data);
}

export async function deleteDive(id: string) {
  const ref = doc(db, "dives", id);
  return await deleteDoc(ref);
}

