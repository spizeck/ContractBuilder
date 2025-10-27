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

// Central collection ref
const logsCollection = collection(db, 'maintenanceLogs')

// ---- Normalization (consolidated from utils) ----
export function normalizeLog(doc: any, id: string): MaintenanceLog {
  return {
    id,
    assetId: doc.assetId,
    assetName: doc.assetName ?? "",
    category: doc.category,
    kind: doc.kind ?? "service",
    date: toDate(doc.date) ?? new Date(),
    summary: doc.summary ?? "",
    details: doc.details ?? undefined,
    technicianId: doc.technicianId ?? undefined,
    technicianName: doc.technicianName ?? undefined,
    readingHours: num(doc.readingHours) ?? num(doc.hoursAtService),
    nextServiceDueHours: num(doc.nextServiceDueHours) ?? num(doc.nextServiceDue),
    readingKilometers: num(doc.readingKilometers),
    nextServiceDueKilometers: num(doc.nextServiceDueKilometers),
    nextServiceDueDate: toDate(doc.nextServiceDueDate),
    cost: num(doc.cost),
    attachments: Array.isArray(doc.attachments) ? doc.attachments : [],
    createdBy: doc.createdBy ?? "",
    createdAt: toDate(doc.createdAt) ?? new Date(),
    // legacy
    hoursAtService: num(doc.hoursAtService),
    nextServiceDue: num(doc.nextServiceDue),
  };
}

function toDate(v: any): Date | undefined {
  if (!v) return undefined;
  if (v instanceof Date) return v;
  if (v?.toDate) return v.toDate() as Date;
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(+d) ? undefined : d;
  }
  return undefined;
}
function num(v: any): number | undefined {
  if (v == null) return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
}

// ---- CRUD ----

export async function getMaintenanceLogs(): Promise<MaintenanceLog[]> {
  const snap = await getDocs(logsCollection)
  return snap.docs.map((d) => normalizeLog(d.data(), d.id))
}

export async function addMaintenanceLog(
  data: Omit<MaintenanceLog, 'id' | 'createdAt'> & { createdBy: string }
) {
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
    if (!docSnap.exists()) return null
    return normalizeLog(docSnap.data(), docSnap.id)
  } catch (err) {
    console.error("Failed to get maintenance log:", err)
    return null
  }
}

// ---- Live subscriptions ----

const logConverter: FirestoreDataConverter<MaintenanceLog> = {
  toFirestore(l: MaintenanceLog) {
    return l as any;
  },
  fromFirestore(snapshot, options) {
    // Normalize everything including Dates
    return normalizeLog(snapshot.data(options), snapshot.id);
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

  const constraints: any[] = [orderBy("date", "desc")];
  if (start) constraints.push(where("date", ">=", Timestamp.fromDate(start)));
  if (end) constraints.push(where("date", "<=", Timestamp.fromDate(end)));
  if (opts?.technicianId) constraints.push(where("technicianId", "==", opts.technicianId));

  const q = query(col, ...constraints);
  return onSnapshot(q, (snap) => handler(snap.docs.map((d) => d.data())));
}