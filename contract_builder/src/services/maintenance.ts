import { db } from '@/lib/firebase'
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  getDoc,
  FirestoreDataConverter,
  where,
  onSnapshot,
  limit,
  Timestamp,
} from 'firebase/firestore'
import { MaintenanceLog } from '@/types/maintenance'

const logsCollection = collection(db, 'maintenanceLogs')

export async function getMaintenanceLogs(): Promise<MaintenanceLog[]> {
  const q = query(logsCollection, orderBy('date', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(docSnap => {
    const data: any = docSnap.data()
    // Firestore returns Timestamps for date fields; convert to JS Date when present
    const dateField = data.date
    const createdAtField = data.createdAt
    return ({
      id: docSnap.id,
      ...data,
      date: dateField && typeof dateField.toDate === 'function' ? dateField.toDate() : dateField,
      createdAt: createdAtField && typeof createdAtField.toDate === 'function' ? createdAtField.toDate() : createdAtField,
    }) as MaintenanceLog
  })
}

export async function addMaintenanceLog(data: Omit<MaintenanceLog, 'id' | 'createdAt'> & { createdBy: string }) {
  return await addDoc(logsCollection, {
    ...data,
    createdAt: serverTimestamp(),
  })
}

export async function updateMaintenanceLog(id: string, data: Partial<MaintenanceLog>) {
  const ref = doc(db, 'maintenanceLogs', id)
  await updateDoc(ref, {
    ...data,
  })
}

export async function deleteMaintenanceLog(id: string) {
  const ref = doc(db, 'maintenanceLogs', id)
  await deleteDoc(ref)
}

export async function getMaintenanceLog(id: string): Promise<MaintenanceLog | null> {
  try {
    const ref = doc(db, "maintenanceLogs", id)
    const docSnap = await getDoc(ref)

    if (!docSnap.exists()) {
      return null
    }

    const data: any = docSnap.data()
    const dateField = data.date
    const createdAtField = data.createdAt

    return {
      id: docSnap.id,
      ...data,
      date:
        dateField && typeof dateField.toDate === "function"
          ? dateField.toDate()
          : dateField,
      createdAt:
        createdAtField && typeof createdAtField.toDate === "function"
          ? createdAtField.toDate()
          : createdAtField,
    } as MaintenanceLog
  } catch (err) {
    console.error("Failed to get maintenance log:", err)
    return null
  }
}

// Services for Dashboard

const logConverter: FirestoreDataConverter<MaintenanceLog> = {
  toFirestore(l: MaintenanceLog) {
    return l as any;
  },
  fromFirestore(snapshot, options) {
    const data = snapshot.data(options) as any;
    return {
      id: snapshot.id,
      ...data,
      date: (data.date?.toDate?.() as Date) ?? data.date,
      createdAt: (data.createdAt?.toDate?.() as Date) ?? data.createdAt,
    } as MaintenanceLog;
  },
};

export function onLogsForAsset(
  assetId: string,
  handler: (logs: MaintenanceLog[]) => void,
  opts?: { pageSize?: number }
): () => void {
  const col = collection(db, "maintenanceLogs").withConverter(logConverter);
  const q = query(
    col,
    where("assetId", "==", assetId),
    orderBy("date", "desc"),
    limit(opts?.pageSize ?? 50)
  );
  return onSnapshot(q, (snap) => handler(snap.docs.map((d) => d.data())));
}

export function onLogsInDateRange(
  start: Date | null,
  end: Date | null,
  handler: (logs: MaintenanceLog[]) => void,
  opts?: { technicianId?: string }
): () => void {
  const col = collection(db, "maintenanceLogs").withConverter(logConverter);

  // Build range query when possible to reduce traffic; otherwise stream recent months and filter client-side.
  const constraints: any[] = [orderBy("date", "desc")];
  if (start) constraints.push(where("date", ">=", Timestamp.fromDate(start)));
  if (end) constraints.push(where("date", "<=", Timestamp.fromDate(end)));
  if (opts?.technicianId) constraints.push(where("technicianId", "==", opts.technicianId));

  const q = query(col, ...constraints);
  return onSnapshot(q, (snap) => handler(snap.docs.map((d) => d.data())));
}