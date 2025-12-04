// src/services/technicians.ts
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  where,
  onSnapshot,
  limit,
  startAfter,
  DocumentSnapshot,
  DocumentData,
  FirestoreDataConverter,
  serverTimestamp,
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

export interface PaginatedTechniciansResult {
  technicians: Technician[];
  hasNextPage: boolean;
  hasPrevPage: boolean;
  lastDoc?: DocumentSnapshot;
}

export async function getTechniciansPaginated(
  pageSize: number = 10,
  startAfterDoc?: DocumentSnapshot
): Promise<PaginatedTechniciansResult> {
  const q = startAfterDoc
    ? query(
        techCollection,
        orderBy("name"),
        startAfter(startAfterDoc),
        limit(pageSize)
      )
    : query(techCollection, orderBy("name"), limit(pageSize));
  
  const snapshot = await getDocs(q);
  const technicians = snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as Technician[];

  return {
    technicians,
    hasNextPage: technicians.length === pageSize,
    hasPrevPage: !!startAfterDoc,
    lastDoc: snapshot.docs[snapshot.docs.length - 1],
  };
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
    return t as DocumentData;
  },
  fromFirestore(snapshot, options) {
    const data = snapshot.data(options) as DocumentData;
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
