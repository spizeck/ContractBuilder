// src/services/assets.ts
import { db } from '@/lib/firebase'
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore'
import { Asset } from '@/types/maintenance'

const assetsCollection = collection(db, 'assets')

export async function getAssets(): Promise<Asset[]> {
  const snapshot = await getDocs(assetsCollection)
  return snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data()
  })) as Asset[]
}

export async function addAsset(data: Omit<Asset, 'id'>) {
  return await addDoc(assetsCollection, {
    ...data,
    createdAt: serverTimestamp()
  })
}

export async function updateAsset(id: string, data: Partial<Asset>) {
  const ref = doc(db, 'assets', id)
  await updateDoc(ref, data)
}

export async function deleteAsset(id: string) {
  const ref = doc(db, 'assets', id)
  await deleteDoc(ref)
}
