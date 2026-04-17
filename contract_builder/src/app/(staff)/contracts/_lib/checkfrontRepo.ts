import { db } from '@core/db/firebase'
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  Timestamp,
  orderBy,
  limit,
} from 'firebase/firestore'
import {
  CheckfrontItemMapping,
  CheckfrontSyncLog,
} from '../_types'

const CHECKFRONT_MAPPINGS_COLLECTION = 'checkfrontItemMappings'
const SYNC_LOGS_SUBCOLLECTION = 'syncLogs'

// ============================================================================
// Checkfront Item Mappings CRUD
// ============================================================================

export async function createCheckfrontItemMapping(
  mapping: Omit<CheckfrontItemMapping, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const now = new Date()
  const docRef = await addDoc(collection(db, CHECKFRONT_MAPPINGS_COLLECTION), {
    ...mapping,
    createdAt: now,
    updatedAt: now,
  })
  return docRef.id
}

export async function updateCheckfrontItemMapping(
  mappingId: string,
  mapping: Partial<Omit<CheckfrontItemMapping, 'id' | 'createdAt'>>
): Promise<void> {
  const docRef = doc(db, CHECKFRONT_MAPPINGS_COLLECTION, mappingId)
  await updateDoc(docRef, {
    ...mapping,
    updatedAt: new Date(),
  })
}

export async function getCheckfrontItemMappings(): Promise<CheckfrontItemMapping[]> {
  const querySnapshot = await getDocs(collection(db, CHECKFRONT_MAPPINGS_COLLECTION))
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<CheckfrontItemMapping, 'id'>),
  }))
}

export async function getCheckfrontItemMappingsByHotel(
  hotelId: string
): Promise<CheckfrontItemMapping[]> {
  const q = query(
    collection(db, CHECKFRONT_MAPPINGS_COLLECTION),
    where('hotelId', '==', hotelId)
  )
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<CheckfrontItemMapping, 'id'>),
  }))
}

export async function getCheckfrontItemMappingByLocalEntity(
  localEntityType: CheckfrontItemMapping['localEntityType'],
  localEntityId: string,
  hotelId?: string
): Promise<CheckfrontItemMapping | undefined> {
  // Build query constraints
  const constraints: Parameters<typeof query>[1][] = [
    where('localEntityType', '==', localEntityType),
    where('localEntityId', '==', localEntityId),
    where('active', '==', true),
  ]

  if (hotelId) {
    constraints.push(where('hotelId', '==', hotelId))
  }

  const q = query(collection(db, CHECKFRONT_MAPPINGS_COLLECTION), ...constraints)
  const querySnapshot = await getDocs(q)

  if (querySnapshot.empty) {
    return undefined
  }

  // Return the first active mapping
  const doc = querySnapshot.docs[0]
  return {
    id: doc.id,
    ...(doc.data() as Omit<CheckfrontItemMapping, 'id'>),
  }
}

export async function getCheckfrontItemMappingById(
  mappingId: string
): Promise<CheckfrontItemMapping | undefined> {
  const docRef = doc(db, CHECKFRONT_MAPPINGS_COLLECTION, mappingId)
  const docSnap = await getDoc(docRef)
  return docSnap.exists()
    ? { id: docSnap.id, ...(docSnap.data() as Omit<CheckfrontItemMapping, 'id'>) }
    : undefined
}

// ============================================================================
// Checkfront Sync Logs (subcollection under groupContracts/{contractId})
// ============================================================================

export async function createCheckfrontSyncLog(
  contractId: string,
  log: Omit<CheckfrontSyncLog, 'id' | 'createdAt'>
): Promise<string> {
  const logsCollection = collection(
    db,
    'groupContracts',
    contractId,
    SYNC_LOGS_SUBCOLLECTION
  )
  const docRef = await addDoc(logsCollection, {
    ...log,
    createdAt: new Date(),
  })
  return docRef.id
}

export async function getCheckfrontSyncLogs(
  contractId: string,
  maxLogs: number = 50
): Promise<CheckfrontSyncLog[]> {
  const logsCollection = collection(
    db,
    'groupContracts',
    contractId,
    SYNC_LOGS_SUBCOLLECTION
  )
  const q = query(logsCollection, orderBy('createdAt', 'desc'), limit(maxLogs))
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<CheckfrontSyncLog, 'id'>),
  }))
}
