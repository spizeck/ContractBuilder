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
  runTransaction,
  DocumentData,
} from "firebase/firestore";
import { db } from "@core/db/firebase";
import type { Asset, AssetCategory, ServiceTracking } from "../_types";

// Central collection ref
const assetsCollection = collection(db, "assets");

// ---- Normalization (consolidated from utils) ----
export function normalizeAsset(doc: DocumentData, id: string): Asset {
  const serviceTracking: ServiceTracking = (doc.serviceTracking as ServiceTracking) ?? "none";

  const createdAt = toDate(doc.createdAt);
  const updatedAt = toDate(doc.updatedAt);
  const lastServiceDate = toDate(doc.lastServiceDate);
  const nextServiceDueDate = toDate(doc.nextServiceDueDate);

  const base = {
    id,
    name: doc.name ?? "",
    category: (doc.category as AssetCategory) ?? "Other",
    description: doc.description ?? "",
    serialNumber: doc.serialNumber ?? "",
    location: doc.location ?? undefined,
    active: doc.active ?? true,
    parentAssetId: doc.parentAssetId ?? undefined,
    parentAssetName: doc.parentAssetName ?? undefined,
    subAssetIds: doc.subAssetIds ?? [],
    metadata: doc.metadata ?? {},
    createdAt,
    updatedAt,
    // legacy
    hours: doc.hours,
    nextServiceDue: doc.nextServiceDue,
    lastServiceDate,
  } as const;

  if (serviceTracking === "hours") {
    return {
      ...base,
      serviceTracking: "hours",
      currentHours: num(doc.currentHours),
      serviceIntervalHours: num(doc.serviceIntervalHours),
      nextServiceDueHours: num(doc.nextServiceDueHours),
      lastServiceDate,
    };
  }
  if (serviceTracking === "kilometers") {
    return {
      ...base,
      serviceTracking: "kilometers",
      currentKilometers: num(doc.currentKilometers),
      serviceIntervalKilometers: num(doc.serviceIntervalKilometers),
      nextServiceDueKilometers: num(doc.nextServiceDueKilometers),
      lastServiceDate,
    };
  }
  if (serviceTracking === "date") {
    return {
      ...base,
      serviceTracking: "date",
      serviceIntervalDays: num(doc.serviceIntervalDays),
      nextServiceDueDate,
      lastServiceDate,
    };
  }
  return { ...base, serviceTracking: "none" };
}

function toDate(v: unknown): Date | undefined {
  if (!v) return undefined;
  if (v instanceof Date) return v;
  if (typeof v === 'object' && v !== null && 'toDate' in v && typeof v.toDate === 'function') {
    return v.toDate() as Date;
  }
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(+d) ? undefined : d;
  }
  return undefined;
}
function num(v: unknown): number | undefined {
  if (v == null) return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
}

// ---- CRUD OPERATIONS ----

/** Get all assets (normalized) */
export async function getAssets(): Promise<Asset[]> {
  const snap = await getDocs(assetsCollection);
  return snap.docs.map((d) => normalizeAsset(d.data(), d.id));
}

/** Add a new asset */
export async function addAsset(data: Omit<Asset, "id">) {
  return await addDoc(assetsCollection, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/** Update an existing asset */
export async function updateAsset(id: string, data: Partial<Asset>) {
  const ref = doc(db, "assets", id);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/** Delete an asset */
export async function deleteAsset(id: string) {
  const ref = doc(db, "assets", id);
  await deleteDoc(ref);
}

// ---- RELATIONSHIP HELPERS ----

/** Get all sub-assets belonging to a parent asset */
export async function getSubAssets(parentAssetId: string): Promise<Asset[]> {
  const q = query(assetsCollection, where("parentAssetId", "==", parentAssetId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => normalizeAsset(docSnap.data(), docSnap.id));
}

/** Get the parent asset for a given sub-asset */
export async function getParentAsset(subAssetId: string): Promise<Asset | null> {
  const subDoc = await getDoc(doc(db, "assets", subAssetId));
  if (!subDoc.exists()) return null;

  const subAsset = normalizeAsset(subDoc.data(), subDoc.id);
  if (!subAsset.parentAssetId) return null;

  const parentDoc = await getDoc(doc(db, "assets", subAsset.parentAssetId));
  return parentDoc.exists() ? normalizeAsset(parentDoc.data(), parentDoc.id) : null;
}

/** Link a child asset to a parent asset (keeps both sides in sync) */
export async function linkAssets(parentId: string, childId: string) {
  const parentRef = doc(db, "assets", parentId);
  const childRef = doc(db, "assets", childId);

  await runTransaction(db, async (tx) => {
    const parentSnap = await tx.get(parentRef);
    const childSnap = await tx.get(childRef);
    if (!parentSnap.exists() || !childSnap.exists())
      throw new Error("Parent or child asset not found");

    const parent = normalizeAsset(parentSnap.data(), parentSnap.id);
    const newSubAssetIds = Array.from(new Set([...(parent.subAssetIds || []), childId]));

    tx.update(parentRef, {
      subAssetIds: newSubAssetIds,
      updatedAt: serverTimestamp(),
    });
    tx.update(childRef, {
      parentAssetId: parentId,
      parentAssetName: parent.name,
      updatedAt: serverTimestamp(),
    });
  });
}

/** Unlink a child asset from its parent (keeps both sides in sync) */
export async function unlinkAssets(parentId: string, childId: string) {
  const parentRef = doc(db, "assets", parentId);
  const childRef = doc(db, "assets", childId);

  await runTransaction(db, async (tx) => {
    const parentSnap = await tx.get(parentRef);
    const childSnap = await tx.get(childRef);
    if (!parentSnap.exists() || !childSnap.exists())
      throw new Error("Parent or child asset not found");

    const parent = normalizeAsset(parentSnap.data(), parentSnap.id);
    const updatedSubAssetIds = (parent.subAssetIds || []).filter((id) => id !== childId);

    tx.update(parentRef, {
      subAssetIds: updatedSubAssetIds,
      updatedAt: serverTimestamp(),
    });
    tx.update(childRef, {
      parentAssetId: null,
      parentAssetName: null,
      updatedAt: serverTimestamp(),
    });
  });
}

// ---- Live subscriptions (normalized) ----

const assetsConverter: FirestoreDataConverter<Asset> = {
  toFirestore(asset: Asset) {
    return asset as DocumentData;
  },
  fromFirestore(snapshot, options) {
    // Normalize everything including Dates/tracking
    return normalizeAsset(snapshot.data(options), snapshot.id);
  },
};

export function subscribeAssets(opts?: { activeOnly?: boolean }): () => void {
  const col = collection(db, "assets").withConverter(assetsConverter);
  const q = opts?.activeOnly
    ? query(col, where("active", "==", true), orderBy("name"))
    : query(col, orderBy("name"));

  // No-op subscriber; callers should provide their own handler via wrapper hooks.
  return onSnapshot(q, () => {});
}

export function onAssetsSnapshot(
  handler: (assets: Asset[]) => void,
  opts?: { activeOnly?: boolean }
): () => void {
  const col = collection(db, "assets").withConverter(assetsConverter);
  const q = opts?.activeOnly
    ? query(col, where("active", "==", true), orderBy("name"))
    : query(col, orderBy("name"));

  return onSnapshot(q, (snap) => {
    handler(snap.docs.map((d) => d.data()));
  });
}
