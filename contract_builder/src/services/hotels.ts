import {db} from '../../firebase';
import {addDoc, collection, deleteDoc, doc, getDoc, getDocs, updateDoc} from 'firebase/firestore';
import {Hotel} from "@/types";

// Add a new hotel
export async function addHotel(hotelData: any) {
  try {
    const docRef = await addDoc(collection(db, 'hotels'), hotelData);
    console.log("Hotel added with ID: ", docRef.id);
    return docRef.id;
  } catch (e) {
    console.error("Error adding hotel: ", e);
  }
}

// Fetch all hotels
export async function getHotels(): Promise<Hotel[]> {
  const querySnapshot = await getDocs(collection(db, "hotels"));
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Hotel, 'id'>),
  }));
}

// Edit hotel data
export async function updateHotel(hotelId: string, hotelData: any) {
  const hotelRef = doc(db, 'hotels', hotelId);
  try {
    await updateDoc(hotelRef, hotelData);
    console.log("Hotel updated: ", hotelId);

  } catch (e) {
    console.error("Error updating hotel: ", e);
  }
}

// Delete hotel
export async function deleteHotel(hotelId: string) {
  const hotelRef = doc(db, 'hotels', hotelId);
  try {
    await deleteDoc(hotelRef);
    console.log("Hotel deleted: ", hotelId);
  } catch (e) {
    console.error("Error deleting hotel: ", e);
  }
}

export async function getHotelById(hotelId: string): Promise<Hotel | null> {
const hotelRef = doc(db, 'hotels', hotelId);
  const docSnap = await getDoc(hotelRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...(docSnap.data() as Omit<Hotel, 'id'>) };
  } else {
    return null;
  }
}