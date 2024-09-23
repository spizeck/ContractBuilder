import {db} from "../../firebase";
import {addDoc, collection, deleteDoc, doc, getDocs, updateDoc,} from "firebase/firestore";

export interface DivePackage {
  id: string;
  name: string;
  description: string;
  price: number;
}

const divePackagesCollection = collection(db, "divePackages");

export async function getDivePackages(): Promise<DivePackage[]> {
  const querySnapshot = await getDocs(divePackagesCollection);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<DivePackage, "id">),
  }));
}

export async function addDivePackage(divePackageData: Omit<DivePackage, "id">): Promise<string> {
  const docRef = await addDoc(divePackagesCollection, divePackageData);
  return docRef.id;
}

export async function updateDivePackage(
  divePackageId: string,
  divePackageData: Partial<DivePackage>
): Promise<void> {
  const docRef = doc(db, "divePackages", divePackageId);
  await updateDoc(docRef, divePackageData);
}

export async function deleteDivePackage(divePackageId: string): Promise<void> {
  const docRef = doc(db, "divePackages", divePackageId);
  await deleteDoc(docRef);
}