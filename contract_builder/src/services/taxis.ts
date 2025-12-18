import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Taxi } from '@/types/taxiTypes';

const TAXIS_COLLECTION = 'taxis';

function removeUndefinedAndEmpty<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== '')
  ) as Partial<T>;
}

function normalizePhoneNumber(input: unknown): unknown {
  if (typeof input !== 'string') return input;
  let s = input.trim();
  if (!s) return '';
  if (s.startsWith('00')) s = `+${s.slice(2)}`;
  const hasPlus = s.startsWith('+');
  const digitsOnly = s.replace(/\D/g, '');
  return hasPlus ? `+${digitsOnly}` : digitsOnly;
}

export const taxiService = {
  // Get all active taxis
  async getAllTaxis(options?: { includeInactive?: boolean }): Promise<Taxi[]> {
    try {
      console.log('Fetching taxis from collection:', TAXIS_COLLECTION);
      const includeInactive = options?.includeInactive === true;
      const q = includeInactive
        ? query(collection(db, TAXIS_COLLECTION), orderBy('name'))
        : query(collection(db, TAXIS_COLLECTION), where('active', '==', true), orderBy('name'));
      const querySnapshot = await getDocs(q);
      console.log('Query successful, found', querySnapshot.docs.length, 'taxis');
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Taxi[];
    } catch (error) {
      console.error('Taxi service error:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      throw error;
    }
  },

  // Get taxi by ID
  async getTaxiById(id: string): Promise<Taxi | null> {
    const docRef = doc(db, TAXIS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate(),
        updatedAt: docSnap.data().updatedAt?.toDate()
      } as Taxi;
    }
    return null;
  },

  // Add new taxi
  async addTaxi(taxiData: Omit<Taxi, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const newTaxi = {
      ...removeUndefinedAndEmpty({
        ...(taxiData as Record<string, unknown>),
        driverContact: normalizePhoneNumber((taxiData as any).driverContact),
      }),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const docRef = await addDoc(collection(db, TAXIS_COLLECTION), newTaxi);
    return docRef.id;
  },

  // Update taxi
  async updateTaxi(id: string, taxiData: Partial<Omit<Taxi, 'id' | 'createdAt'>>): Promise<void> {
    const docRef = doc(db, TAXIS_COLLECTION, id);
    await updateDoc(docRef, {
      ...removeUndefinedAndEmpty({
        ...(taxiData as Record<string, unknown>),
        driverContact: normalizePhoneNumber((taxiData as any).driverContact),
      }),
      updatedAt: new Date()
    });
  },

  // Delete (deactivate) taxi
  async deleteTaxi(id: string): Promise<void> {
    const docRef = doc(db, TAXIS_COLLECTION, id);
    await updateDoc(docRef, {
      active: false,
      updatedAt: new Date()
    });
  },

  // Permanently delete taxi (admin only)
  async permanentDeleteTaxi(id: string): Promise<void> {
    const docRef = doc(db, TAXIS_COLLECTION, id);
    await deleteDoc(docRef);
  }
};
