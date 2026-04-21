import { db } from '@core/db/firebase'
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc
} from 'firebase/firestore'
import { GroupContract } from '../_types'

export async function getGroupContracts (): Promise<GroupContract[]> {
  const querySnapshot = await getDocs(collection(db, 'groupContracts'))
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<GroupContract, 'id'>)
  }))
}

export async function addGroupContract (
  contractData: Omit<GroupContract, 'id'>
): Promise<string> {
  const docRef = await addDoc(collection(db, 'groupContracts'), contractData)
  return docRef.id
}

export async function updateGroupContract (
  contractId: string,
  contractData: Partial<GroupContract>
): Promise<void> {
  const docRef = doc(db, 'groupContracts', contractId)
  await updateDoc(docRef, contractData)
}

export async function archiveGroupContract (
  contractId: string,
  supersededBy?: string
): Promise<void> {
  const docRef = doc(db, 'groupContracts', contractId)
  await updateDoc(docRef, {
    archived: true,
    archivedAt: new Date(),
    ...(supersededBy ? { supersededBy } : {}),
  })
}

export async function getGroupContractById (
  contractId: string
): Promise<GroupContract | undefined> {
  const docRef = doc(db, 'groupContracts', contractId)
  const docSnap = await getDoc(docRef)
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as GroupContract : undefined
}

export function formatBookingType (code: string): string {
  switch (code) {
    case 'diveShop10':
      return 'Dive Shop 10%'
    case 'diveShop15':
      return 'Dive Shop 15%'
    case 'tourOperator20':
      return 'Tour Operator 20%'
    case 'tourOperator25':
      return 'Tour Operator 25%'
    default:
      return code
  }
}
