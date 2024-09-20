import {db} from "../../firebase";
import {doc, collection, addDoc, getDocs, updateDoc, deleteDoc, query, where} from "firebase/firestore";

export interface Season {
  id: string;
  hotelId: string;
  name: string;
  startDate: string;
  endDate: string;
}

// Add a season to the root-level 'seasons' collection
export async function addSeason(seasonData: Omit<Season, "id">): Promise<string> {
  try {
    const seasonRef = await addDoc(collection(db, "seasons"), seasonData);
    console.log("Season added with ID: ", seasonRef.id);
    return seasonRef.id;
  } catch (e) {
    console.error("Error adding season: ", e);
    throw e;
  }
}

// Fetch all seasons for a specific hotel
export async function getSeasons(hotelId: string): Promise<Season[]> {
  try {
    const seasonsRef = collection(db, "seasons");
    const q = query(seasonsRef, where("hotelId", "==", hotelId));
    const seasonsSnapshot = await getDocs(q);
    return seasonsSnapshot.docs.map((doc) => {
      const data = doc.data() as Omit<Season, 'id'>; // Exclude 'id' from data
      return { id: doc.id, ...data };
    });
  } catch (e) {
    console.error("Error getting seasons: ", e);
    throw e;
  }
}

// Update a season
export async function updateSeason(seasonId: string, seasonData: Partial<Season>): Promise<void> {
  try {
    const seasonRef = doc(db, "seasons", seasonId);
    await updateDoc(seasonRef, seasonData);
    console.log("Season updated: ", seasonId);
  } catch (e) {
    console.error("Error updating season: ", e);
    throw e;
  }
}

// Delete a season
export async function deleteSeason(seasonId: string): Promise<void> {
  try {
    const seasonRef = doc(db, "seasons", seasonId);
    await deleteDoc(seasonRef);
    console.log("Season deleted: ", seasonId);
  } catch (e) {
    console.error("Error deleting season: ", e);
    throw e;
  }
}