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
  orderBy
} from 'firebase/firestore'
import { MaintenanceLog } from '@/types/maintenance'

const logsCollection = collection(db, 'maintenanceLogs')

export async function getMaintenanceLogs(): Promise<MaintenanceLog[]> {
  const q = query(logsCollection, orderBy('date', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data()
  })) as MaintenanceLog[]
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
