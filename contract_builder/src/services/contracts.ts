import {db} from "../../firebase";
import {doc, collection, addDoc, getDocs} from "firebase/firestore";

// Add a group contract to a specific hotel
export async function addContract(hotelId: string, contractData: any) {
  try {
    const hotelRef = doc(db, "hotels", hotelId);
    const contractRef = await addDoc(collection(hotelRef, "groupContracts"), contractData);
    console.log("Group Contract added with ID: ", contractRef.id);
    return contractRef.id;
  } catch (e) {
    console.error("Error adding group contract: ", e);
  }
}

// Fetch all contracts for a specific hotel
export async function getContracts(hotelId: string) {
  try {
    const hotelRef = doc(db, "hotels", hotelId);
    const contractsSnapshot = await getDocs(collection(hotelRef, "groupContracts"));
    return contractsSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
  } catch (e) {
    console.error("Error getting group contracts: ", e);
  }
}
