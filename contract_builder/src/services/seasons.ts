import {db} from "../../firebase";
import {addDoc, collection, doc, getDocs, orderBy, query, updateDoc, where} from "firebase/firestore";
import {Season} from "@/types";

// Add a season to the root-level 'seasons' collection
export async function addSeason(
  seasonData: Omit<Season, "id">
): Promise<string> {
  try {
    const seasonRef = await addDoc(collection(db, "seasons"), seasonData);
    console.log("Season added with ID: ", seasonRef.id);
    return seasonRef.id;
  } catch (e) {
    console.error("Error adding season: ", e);
    throw e;
  }
}

// Fetch all seasons for a specific hotel, sorted by startDate
export async function getSeasons(hotelId: string): Promise<Season[]> {
  try {
    const seasonsRef = collection(db, "seasons");
    const q = query(
      seasonsRef,
      where("hotelId", "==", hotelId),
      where("archived", "==", false), // only include active seasons
      orderBy("startDate") // ascending by default
    );
    const seasonsSnapshot = await getDocs(q);

    return seasonsSnapshot.docs.map((doc) => {
      const data = doc.data() as Omit<Season, "id">;
      return { id: doc.id, ...data };
    });
  } catch (e) {
    console.error("Error getting seasons: ", e);
    throw e;
  }
}

// Update a season
export async function updateSeason(
  seasonId: string,
  seasonData: Partial<Season>
): Promise<void> {
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
    await updateDoc(seasonRef, { archived: true });
    console.log("Season archived: ", seasonId);
  } catch (e) {
    console.error("Error archiving season: ", e);
    throw e;
  }
}
