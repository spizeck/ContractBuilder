import { db } from '../lib/firebase'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where
} from 'firebase/firestore'
import { RoomType } from '@/types'

const roomTypesRef = collection(db, 'roomTypes')

export async function getRoomTypes (hotelId: string): Promise<RoomType[]> {
  const q = query(roomTypesRef, where('hotelId', '==', hotelId))
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<RoomType, 'id'>)
  }))
}

export async function addRoomType (
  roomTypeData: Omit<RoomType, 'id'>
): Promise<string> {
  const docRef = await addDoc(collection(db, 'roomTypes'), roomTypeData)

  if (roomTypeData.isFocBase) {
    await setHotelFocBase(roomTypeData.hotelId, docRef.id)

    // unset others
    const q = query(roomTypesRef, where('hotelId', '==', roomTypeData.hotelId))
    const snapshot = await getDocs(q)
    const batch = snapshot.docs
      .filter(d => d.id !== docRef.id)
      .map(d => updateDoc(d.ref, { isFocBase: false }))
    await Promise.all(batch)
  }

  return docRef.id
}

export async function updateRoomType (
  roomTypeId: string,
  roomTypeData: Partial<RoomType>
): Promise<void> {
  const docRef = doc(db, 'roomTypes', roomTypeId)
  await updateDoc(docRef, roomTypeData)

  if (roomTypeData.isFocBase) {
    await setHotelFocBase(roomTypeData.hotelId!, roomTypeId)

    // unset others
    const q = query(roomTypesRef, where('hotelId', '==', roomTypeData.hotelId))
    const snapshot = await getDocs(q)
    const batch = snapshot.docs
      .filter(d => d.id !== roomTypeId)
      .map(d => updateDoc(d.ref, { isFocBase: false }))
    await Promise.all(batch)
  }
}

async function setHotelFocBase (hotelId: string, roomTypeId: string) {
  const hotelRef = doc(db, 'hotels', hotelId)
  await updateDoc(hotelRef, { focBaseRate: roomTypeId })
}
export async function deleteRoomType (roomTypeId: string): Promise<void> {
  const docRef = doc(db, 'roomTypes', roomTypeId)
  await deleteDoc(docRef)
}
