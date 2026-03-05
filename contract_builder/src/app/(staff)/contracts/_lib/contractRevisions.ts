import { Timestamp } from 'firebase/firestore'

type FirestoreRecord = Record<string, unknown>

export function clonePaymentForRevision(
  paymentData: FirestoreRecord,
  newContractId: string,
  previousContractId: string
): FirestoreRecord {
  return {
    ...paymentData,
    contractId: newContractId,
    revisedFromContractId: previousContractId,
    revisedAt: Timestamp.now()
  }
}

export function cloneNoteForRevision(noteData: FirestoreRecord): FirestoreRecord {
  return {
    ...noteData,
    revisedAt: Timestamp.now()
  }
}
