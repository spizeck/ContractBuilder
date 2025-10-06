// src/services/dives.ts
import { db } from '@/lib/firebase'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  QueryDocumentSnapshot,
  serverTimestamp,
  startAfter,
  updateDoc,
  where
} from 'firebase/firestore'
import { Dive } from '@/types/diveLogTypes'

const divesCollection = collection(db, 'dives')

export async function getDives (): Promise<Dive[]> {
  const q = query(divesCollection, orderBy('date', 'desc'))
  const snapshot = await getDocs(q)

  return snapshot.docs.map(doc => {
    const data = doc.data()
    let jsDate: Date | null = null

    if (data.date) {
      if (typeof data.date.toDate === 'function') {
        // Firestore Timestamp
        jsDate = data.date.toDate()
      } else if (
        typeof data.date === 'string' ||
        typeof data.date === 'number'
      ) {
        // ISO string or numeric timestamp
        jsDate = new Date(data.date)
      }
    }

    return {
      id: doc.id,
      ...data,
      date: jsDate
    } as Dive
  })
}

export async function addDive (data: Omit<Dive, 'id'>) {
  const cleanedSightings = (data.sightings || []).filter(s => s.count > 0)

  return await addDoc(divesCollection, {
    ...data,
    sightings: cleanedSightings,
    date:
      data.date instanceof Date
        ? data.date.toISOString().split('T')[0]
        : data.date,
    maxDepth: data.maxDepth,
    waterTemperature: data.waterTemperature,
    createdAt: serverTimestamp()
  })
}

export async function getDive (id: string): Promise<Dive | null> {
  const ref = doc(db, 'dives', id)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null

  const data = snap.data()
  return {
    id: snap.id,
    ...data,
    date: data.date?.toDate ? data.date.toDate() : data.date
  } as Dive
}

export async function updateDive (id: string, data: Partial<Dive>) {
  const ref = doc(db, 'dives', id)

  const cleanedSightings =
    data.sightings?.filter(s => s.count > 0) ?? data.sightings

  return await updateDoc(ref, {
    ...data,
    date:
      data.date instanceof Date
        ? data.date.toISOString().split('T')[0]
        : data.date,
    sightings: cleanedSightings
  })
}

export async function deleteDive (id: string) {
  const ref = doc(db, 'dives', id)
  return await deleteDoc(ref)
}

export async function getUserDives (uid: string): Promise<Dive[]> {
  const q = query(
    divesCollection,
    where('createdBy', '==', uid),
    orderBy('date', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      date: data.date?.toDate ? data.date.toDate() : data.date
    } as Dive
  })
}

export async function checkDuplicateDive (
  date: string, // stored as string: 'YYYY-MM-DD'
  diveSlot: string,
  boatId: string,
  excludeId?: string // optional
): Promise<boolean> {
  if (!date || !diveSlot || !boatId) return false

  const q = query(
    divesCollection,
    where('date', '==', date),
    where('diveSlot', '==', diveSlot),
    where('boatId', '==', boatId)
  )

  const snapshot = await getDocs(q)

  // Exclude the current dive being edited
  const duplicates = snapshot.docs.filter(doc => doc.id !== excludeId)

  return duplicates.length > 0
}

export async function getDivesPage (
  pageSize: number,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<{
  dives: Dive[]
  lastDoc: QueryDocumentSnapshot<DocumentData> | null
}> {
  let q = query(divesCollection, orderBy('date', 'desc'), limit(pageSize))
  if (lastDoc) {
    q = query(
      divesCollection,
      orderBy('date', 'desc'),
      startAfter(lastDoc),
      limit(pageSize)
    )
  }

  const snapshot = await getDocs(q)

  const dives = snapshot.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      date: data.date?.toDate ? data.date.toDate() : data.date
    } as Dive
  })

  const newLastDoc =
    snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null

  return { dives, lastDoc: newLastDoc }
}
