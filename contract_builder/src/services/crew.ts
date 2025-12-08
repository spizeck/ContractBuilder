import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CrewMember } from '@/types/crewTypes';

const CREW_COLLECTION = 'crew';

export const crewService = {
  // Get all active crew members
  async getAllCrew(): Promise<CrewMember[]> {
    const q = query(collection(db, CREW_COLLECTION), where('active', '==', true), orderBy('name'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as CrewMember[];
  },

  // Get crew member by ID
  async getCrewById(id: string): Promise<CrewMember | null> {
    const docRef = doc(db, CREW_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate(),
        updatedAt: docSnap.data().updatedAt?.toDate()
      } as CrewMember;
    }
    return null;
  },

  // Get crew by role
  async getCrewByRole(role: CrewMember['role']): Promise<CrewMember[]> {
    const q = query(
      collection(db, CREW_COLLECTION), 
      where('role', '==', role),
      where('active', '==', true),
      orderBy('name')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as CrewMember[];
  },

  // Add new crew member
  async addCrew(crewData: Omit<CrewMember, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const newCrew = {
      ...crewData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const docRef = await addDoc(collection(db, CREW_COLLECTION), newCrew);
    return docRef.id;
  },

  // Update crew member
  async updateCrew(id: string, crewData: Partial<Omit<CrewMember, 'id' | 'createdAt'>>): Promise<void> {
    const docRef = doc(db, CREW_COLLECTION, id);
    await updateDoc(docRef, {
      ...crewData,
      updatedAt: new Date()
    });
  },

  // Delete (deactivate) crew member
  async deleteCrew(id: string): Promise<void> {
    const docRef = doc(db, CREW_COLLECTION, id);
    await updateDoc(docRef, {
      active: false,
      updatedAt: new Date()
    });
  },

  // Permanently delete crew member (admin only)
  async permanentDeleteCrew(id: string): Promise<void> {
    const docRef = doc(db, CREW_COLLECTION, id);
    await deleteDoc(docRef);
  }
};
