import {db} from '../../firebase';
import {addDoc, collection, deleteDoc, doc, getDocs, updateDoc} from 'firebase/firestore';

export interface Hotel {
  id: string;
  name: string;
  location: string;
  description: string;
  contactInfo: string;
  amenities: string;
  policies: string;
}

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
  const hotels: Hotel[] = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Hotel, 'id'>), // Cast doc.data() to Omit<Hotel, 'id'>
  }));
  return hotels;
}

// Edit hotel data
export async function editHotel(hotelId: string, hotelData: any) {
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