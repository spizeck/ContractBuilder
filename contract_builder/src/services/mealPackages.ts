import { db } from "../../firebase";
import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDoc,
} from "firebase/firestore";

export interface MealPackage {
  id: string;
  hotelId: string;
  name: string;
  description: string;
  price: number; // Price per person total
}

export async function getMealPackages(hotelId: string): Promise<MealPackage[]> {
  const q = query(collection(db, "mealPackages"), where("hotelId", "==", hotelId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<MealPackage, "id">),
  }));
}

export async function addMealPackage(mealPackageData: Omit<MealPackage, "id">): Promise<string> {
  const docRef = await addDoc(collection(db, "mealPackages"), mealPackageData);
  return docRef.id;
}

export async function updateMealPackage(
  mealPackageId: string,
  mealPackageData: Partial<MealPackage>
): Promise<void> {
  const docRef = doc(db, "mealPackages", mealPackageId);
  await updateDoc(docRef, mealPackageData);
}

export async function deleteMealPackage(mealPackageId: string): Promise<void> {
  const docRef = doc(db, "mealPackages", mealPackageId);
  await deleteDoc(docRef);
}

export async function getMealPackageById(mealPackageId: string): Promise<MealPackage | null> {
  const docRef = doc(db, "mealPackages", mealPackageId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists()? docSnap.data() as MealPackage : null;
}