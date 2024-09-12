import {db} from "../../firebase";
import {doc, collection, addDoc, getDocs} from "firebase/firestore";

// Add a season to a specific hotel
export async function addSeason(hotelId: string, seasonData: any) {
  try {
    const hotelRef = doc(db, "hotels", hotelId);
    const seasonRef = await addDoc(collection(hotelRef, "seasons"), seasonData);
    console.log("Season added with ID: ", seasonRef.id);
    return seasonRef.id;
  } catch (e) {
    console.error("Error adding season: ", e);
  }
}

// Fetch all seasons for a specific hotel
export async function getSeasons(hotelId: string) {
  try {
    const hotelRef = doc(db, "hotels", hotelId);
    const seasonsSnapshot = await getDocs(collection(hotelRef, "seasons"));
    return seasonsSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
  } catch (e) {
    console.error("Error getting seasons: ", e);
  }
}
