// src/services/dives.ts
import {db} from "@/lib/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import {Dive} from "@/types/diveLogTypes";

const divesCollection = collection(db, "dives");

export async function getDives(): Promise<Dive[]> {
  const q = query(divesCollection, orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: data.date?.toDate ? data.date.toDate() : data.date, // ensure JS Date
    } as Dive;
  });
}

export async function addDive(data: Omit<Dive, "id">) {
  return await addDoc(divesCollection, {
    ...data,
    date: data.date instanceof Date? data.date : new Date(data.date),
    maxDepth: data.maxDepth, // Meters
    waterTemperature: data.waterTemperature, // Celcius
    createdAt: serverTimestamp(),
  });
}

export async function getDive(id: string): Promise<Dive | null> {
  const ref = doc(db, "dives", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const data = snap.data();
  return {
    id: snap.id,
    ...data,
    date: data.date?.toDate ? data.date.toDate() : data.date,
  } as Dive;
}

export async function updateDive(id: string, data: Partial<Dive>) {
  const ref = doc(db, "dives", id);
  return await updateDoc(ref, data);
}

export async function deleteDive(id: string) {
  const ref = doc(db, "dives", id);
  return await deleteDoc(ref);
}


export async function getUserDives(uid: string): Promise<Dive[]> {
  const q = query(
    divesCollection,
    where("createdBy", "==", uid),
    orderBy("date", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: data.date?.toDate ? data.date.toDate() : data.date,
    } as Dive;
  });
}

export async function checkDuplicateDive(
  date: string,
  diveSlot: string,
  boatId: string,
  currentId?: string
): Promise<boolean> {
  const q = query(
    divesCollection,
    where("date", "==", date),
    where("diveSlot", "==", diveSlot),
    where("boatId", "==", boatId)
  );

  const snap = await getDocs(q);
  if (snap.empty) return false;

  // if editing, ignore current dive
  if (currentId) {
    return snap.docs.some((doc) => doc.id !== currentId);
  }

  return true;
}
