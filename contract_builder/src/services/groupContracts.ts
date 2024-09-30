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
import {RoomSelection} from "@/types";

export interface GroupContract {
  groupName: string;
  startDate: string;
  endDate: string;
  hotelId: string;
  hotelName: string;
  seasonId: string;
  seasonName: string;
  bookingType: string;
  rooms: RoomSelection[];
  roomCosts: { description: string; cost: number }[];
  totalRoomCost: number;
  totalGuests: number;
  numDivers: number;
  totalNonDivers: number;
  divePackageId?: string;
  divePackageName?: string;
  divePackageCost?: number;
  mealPackageId?: string;
  mealPackageName?: string;
  mealPackageCost?: number;
  totalCost: number;
  createdAt: Date;
  // Add other fields as needed
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

export async function getGroupContractById(contractId: string): Promise<GroupContract | undefined> {
  const docRef = doc(db, "groupContracts", contractId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists()? docSnap.data() as GroupContract : undefined;
}