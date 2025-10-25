// src/services/technicians.ts
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  FirestoreDataConverter,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { Technician } from "@/types/maintenance";

const techCollection = collection(db, "technicians");

export async function getTechnicians(): Promise<Technician[]> {
  const snapshot = await getDocs(techCollection);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as Technician[];
}

export async function addTechnician(data: Omit<Technician, "id">) {
  return await addDoc(techCollection, {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function updateTechnician(id: string, data: Partial<Technician>) {
  const ref = doc(db, "technicians", id);
  await updateDoc(ref, data);
}

export async function deleteTechnician(id: string) {
  const ref = doc(db, "technicians", id);
  await deleteDoc(ref);
}

// Services for Dashboard

const techConverter: FirestoreDataConverter<Technician> = {
  toFirestore(t: Technician) {
    return t as any;
  },
  fromFirestore(snapshot, options) {
    const data = snapshot.data(options) as any;
    return {
      id: snapshot.id,
      ...data,
    } as Technician;
  },
};

export function onTechniciansSnapshot(
  handler: (techs: Technician[]) => void,
  opts?: { activeOnly?: boolean }
): () => void {
  const col = collection(db, "technicians").withConverter(techConverter);
  const q = opts?.activeOnly
    ? query(col, where("active", "==", true), orderBy("name"))
    : query(col, orderBy("name"));
  return onSnapshot(q, (snap) => handler(snap.docs.map((d) => d.data())));
}
