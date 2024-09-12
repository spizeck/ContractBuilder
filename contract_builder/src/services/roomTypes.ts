import {db} from '../../firebase';
import {doc, collection, addDoc, getDocs} from 'firebase/firestore';

// Add a room type to a specific hotel
export async function addRoomType(hotelId: string, roomTypeData: any) {
  try {
    const hotelRef = doc(db, "hotels", hotelId);
    const roomTypeRef = await addDoc(collection(hotelRef, "roomTypes"), roomTypeData);
    console.log("Room type added with ID: ", roomTypeRef.id);
    return roomTypeRef.id;
  } catch (e) {
    console.error("Error adding room type: ", e);
  }
}

// Fetch all room types for a specific hotel
export async function getRoomTypes(hotelId: string) {
  try {
    const hotelRef = doc(db, "hotels", hotelId);
    const roomTypesSnapshot = await getDocs(collection(hotelRef, "roomTypes"));
    return roomTypesSnapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
  } catch (e) {
    console.error("Error fetching room types: ", e);
  }
}