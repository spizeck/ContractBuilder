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
import { updateAsset } from '@/services/assets'

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

async function syncAssetFromLog(raw: any) {
  if (!raw) return;

  const assetId = raw.assetId;
  if (!assetId) return;

  const date = toDate(raw.date);

  // Load current asset state so we can avoid overwriting with older logs
  const assetRef = doc(db, "assets", assetId);
  const assetSnap = await getDoc(assetRef);
  if (!assetSnap.exists()) return;

  const assetRaw = assetSnap.data();
  const assetLastServiceDate = toDate(assetRaw?.lastServiceDate);
  const assetCurrentHours = num(
    assetRaw?.currentHours != null ? assetRaw.currentHours : assetRaw?.hours
  );

  const reading =
    raw.readingHours != null
      ? num(raw.readingHours)
      : raw.hoursAtService != null
      ? num(raw.hoursAtService)
      : undefined;

  const nextDue =
    raw.nextServiceDueHours != null
      ? num(raw.nextServiceDueHours)
      : raw.nextServiceDue != null
      ? num(raw.nextServiceDue)
      : undefined;

  const update: any = {};

  if (reading != null) {
    // Never roll back current hours; only move forward
    if (assetCurrentHours == null || reading >= assetCurrentHours) {
      update.currentHours = reading;
    }
  }

  if (nextDue != null) {
    // Only update next service / last service date if this log is not older
    // than the asset's existing lastServiceDate (when present).
    if (!date || !assetLastServiceDate || date >= assetLastServiceDate) {
      update.nextServiceDueHours = nextDue;
      if (date) {
        update.lastServiceDate = date;
      }
    }
  }

  if (Object.keys(update).length === 0) return;

  await updateAsset(assetId, update);
}

// ---- CRUD ----

export async function getMaintenanceLogs(): Promise<MaintenanceLog[]> {
  const snap = await getDocs(logsCollection)
  return snap.docs.map((d) => normalizeLog(d.data(), d.id))
}

export async function addMaintenanceLog(
  data: Omit<MaintenanceLog, 'id' | 'createdAt'> & { createdBy: string }
) {
  const payload: any = {
    ...data,
  };

  if (payload.readingHours == null && payload.hoursAtService != null) {
    const n = num(payload.hoursAtService);
    if (n != null) payload.readingHours = n;
  }

  if (payload.nextServiceDueHours == null && payload.nextServiceDue != null) {
    const n = num(payload.nextServiceDue);
    if (n != null) payload.nextServiceDueHours = n;
  }

  const result = await addDoc(logsCollection, {
    ...payload,
    createdAt: serverTimestamp(),
  });

  await syncAssetFromLog(payload);

  return result;
}

export async function updateMaintenanceLog(id: string, data: Partial<MaintenanceLog>) {
  const ref = doc(db, 'maintenanceLogs', id)
  const payload: any = {
    ...data,
  };

  if (payload.readingHours == null && payload.hoursAtService != null) {
    const n = num(payload.hoursAtService);
    if (n != null) payload.readingHours = n;
  }

  if (payload.nextServiceDueHours == null && payload.nextServiceDue != null) {
    const n = num(payload.nextServiceDue);
    if (n != null) payload.nextServiceDueHours = n;
  }

  await updateDoc(ref, {
    ...payload,
  });

  await syncAssetFromLog(payload);
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