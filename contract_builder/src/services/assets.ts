import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  getDoc,
  query,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  where,
  runTransaction,
} from "firebase/firestore";
import { Asset } from "@/types/maintenance";

const assetsCollection = collection(db, "assets");

// ---- CRUD OPERATIONS ----

/** Get all assets */
export async function getAssets(): Promise<Asset[]> {
  const snapshot = await getDocs(assetsCollection);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as Asset[];
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
  const q = query(
    assetsCollection,
    where("parentAssetId", "==", parentAssetId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as Asset[];
}

/** Get the parent asset for a given sub-asset */
export async function getParentAsset(
  subAssetId: string
): Promise<Asset | null> {
  const subDoc = await getDoc(doc(assetsCollection, subAssetId));
  if (!subDoc.exists()) return null;

  const subAsset = { id: subDoc.id, ...subDoc.data() } as Asset;
  if (!subAsset.parentAssetId) return null;

  const parentDoc = await getDoc(doc(assetsCollection, subAsset.parentAssetId));
  return parentDoc.exists()
    ? ({ id: parentDoc.id, ...parentDoc.data() } as Asset)
    : null;
}

/** Link a child asset to a parent asset (keeps both sides in sync) */
export async function linkAssets(parentId: string, childId: string) {
  const parentRef = doc(assetsCollection, parentId);
  const childRef = doc(assetsCollection, childId);

  await runTransaction(db, async (tx) => {
    const parentSnap = await tx.get(parentRef);
    const childSnap = await tx.get(childRef);
    if (!parentSnap.exists() || !childSnap.exists())
      throw new Error("Parent or child asset not found");

    const parent = parentSnap.data() as Asset;
    const newSubAssetIds = Array.from(
      new Set([...(parent.subAssetIds || []), childId])
    );

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
  const parentRef = doc(assetsCollection, parentId);
  const childRef = doc(assetsCollection, childId);

  await runTransaction(db, async (tx) => {
    const parentSnap = await tx.get(parentRef);
    const childSnap = await tx.get(childRef);
    if (!parentSnap.exists() || !childSnap.exists())
      throw new Error("Parent or child asset not found");

    const parent = parentSnap.data() as Asset;
    const updatedSubAssetIds = (parent.subAssetIds || []).filter(
      (id) => id !== childId
    );

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
