import {db} from '../../firebase';
import {collection, addDoc, getDocs, doc} from 'firebase/firestore';

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
export async function getHotels() {
  try {
    const querySnapshot = await getDocs(collection(db, 'hotels'));
    return querySnapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
  } catch (e) {
    console.error("Error fetching hotels: ", e);
  }
}