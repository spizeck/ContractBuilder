import { db } from '../lib/firebase'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  DocumentData,
} from 'firebase/firestore'
import { Hotel } from '@/types/contractTypes'

// Add a new hotel
export async function addHotel(hotelData: Omit<Hotel, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'hotels'), hotelData)
  return docRef.id
}

// Fetch all hotels
export async function getHotels (): Promise<Hotel[]> {
  const querySnapshot = await getDocs(collection(db, 'hotels'))
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<Hotel, 'id'>)
  }))
}

// Edit hotel data
export async function updateHotel(hotelId: string, hotelData: Partial<Hotel>): Promise<void> {
  const hotelRef = doc(db, 'hotels', hotelId)
  await updateDoc(hotelRef, hotelData)
}

// Delete hotel
export async function deleteHotel (hotelId: string): Promise<void> {
  const hotelRef = doc(db, 'hotels', hotelId)
  await deleteDoc(hotelRef)
}

export async function getHotelById (hotelId: string): Promise<Hotel | null> {
  const hotelRef = doc(db, 'hotels', hotelId)
  const docSnap = await getDoc(hotelRef)
  if (docSnap.exists()) {
    return { id: docSnap.id, ...(docSnap.data() as Omit<Hotel, 'id'>) }
  } else {
    return null
  }
}
