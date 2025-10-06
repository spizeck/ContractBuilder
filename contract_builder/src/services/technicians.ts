// src/services/technicians.ts
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
import { Technician } from '@/types/maintenance'

const techCollection = collection(db, 'technicians')

export async function getTechnicians(): Promise<Technician[]> {
  const snapshot = await getDocs(techCollection)
  return snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data()
  })) as Technician[]
}

export async function addTechnician(data: Omit<Technician, 'id'>) {
  return await addDoc(techCollection, {
    ...data,
    createdAt: serverTimestamp()
  })
}

export async function updateTechnician(id: string, data: Partial<Technician>) {
  const ref = doc(db, 'technicians', id)
  await updateDoc(ref, data)
}

export async function deleteTechnician(id: string) {
  const ref = doc(db, 'technicians', id)
  await deleteDoc(ref)
}
