import { db } from "../../firebase";
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";

export interface GroupContract {
  id: string;
  groupName: string;
  hotelId: string;
  startDate: string; // 'YYYY-MM-DD'
  endDate: string;   // 'YYYY-MM-DD'
  bookingType: string; // 'tourOperator' or 'diveShop'
}


export async function getGroupContracts(): Promise<GroupContract[]> {
  const querySnapshot = await getDocs(collection(db, "groupContracts"));
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<GroupContract, "id">),
  }));
}

export async function addGroupContract(contractData: Omit<GroupContract, "id">): Promise<string> {
  const docRef = await addDoc(collection(db, "groupContracts"), contractData);
  return docRef.id;
}

export async function updateGroupContract(contractId: string, contractData: Partial<GroupContract>): Promise<void> {
  const docRef = doc(db, "groupContracts", contractId);
  await updateDoc(docRef, contractData);
}

export async function deleteGroupContract(contractId: string): Promise<void> {
  const docRef = doc(db, "groupContracts", contractId);
  await deleteDoc(docRef);
}

export async function getGroupContractById(contractId: string): Promise<GroupContract | null> {
  const docRef = doc(db, "groupContracts", contractId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...(docSnap.data() as Omit<GroupContract, "id">) };
  } else {
    return null;
  }
}