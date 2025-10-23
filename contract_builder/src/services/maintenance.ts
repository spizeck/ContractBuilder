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