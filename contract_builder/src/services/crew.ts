import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CrewMember, CrewRole } from '@/types/crewTypes';

const CREW_COLLECTION = 'crew';

function removeUndefinedAndEmpty<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== '')
  ) as Partial<T>;
}

function normalizePhoneNumber(input: unknown): unknown {
  if (typeof input !== 'string') return input;

  let s = input.trim();
  if (!s) return '';

  // Convert common international prefix
  if (s.startsWith('00')) {
    s = `+${s.slice(2)}`;
  }

  // Keep digits, and allow a single leading '+'
  const hasPlus = s.startsWith('+');
  const digitsOnly = s.replace(/\D/g, '');
  return hasPlus ? `+${digitsOnly}` : digitsOnly;
}

export const crewService = {
  // Get all active crew members
  async getAllCrew(options?: { includeInactive?: boolean }): Promise<CrewMember[]> {
    try {
      console.log('Fetching crew from collection:', CREW_COLLECTION);
      const includeInactive = options?.includeInactive === true;
      const q = includeInactive
        ? query(collection(db, CREW_COLLECTION), orderBy('name'))
        : query(collection(db, CREW_COLLECTION), where('active', '==', true), orderBy('name'));
      const querySnapshot = await getDocs(q);
      console.log('Query successful, found', querySnapshot.docs.length, 'crew members');
      return querySnapshot.docs.map((doc) => {
        const data = doc.data() as any;
        const roles: CrewRole[] = Array.isArray(data.roles)
          ? data.roles
          : (data.role ? [data.role] : []);

        return {
          id: doc.id,
          name: data.name,
          roles,
          email: data.email,
          phone: data.phone,
          active: data.active,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
        } as CrewMember;
      });
    } catch (error) {
      console.error('Crew service error:', error);
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

  // Get crew member by ID
  async getCrewById(id: string): Promise<CrewMember | null> {
    const docRef = doc(db, CREW_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as any;
      const roles: CrewRole[] = Array.isArray(data.roles)
        ? data.roles
        : (data.role ? [data.role] : []);

      return {
        id: docSnap.id,
        name: data.name,
        roles,
        email: data.email,
        phone: data.phone,
        active: data.active,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
      } as CrewMember;
    }
    return null;
  },

  // Get crew by role
  async getCrewByRole(role: CrewRole): Promise<CrewMember[]> {
    const q = query(
      collection(db, CREW_COLLECTION),
      where('roles', 'array-contains', role),
      where('active', '==', true),
      orderBy('name')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data() as any;
      const roles: CrewRole[] = Array.isArray(data.roles)
        ? data.roles
        : (data.role ? [data.role] : []);

      return {
        id: doc.id,
        name: data.name,
        roles,
        email: data.email,
        phone: data.phone,
        active: data.active,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
      } as CrewMember;
    });
  },

  // Add new crew member
  async addCrew(crewData: Omit<CrewMember, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const newCrew = {
      ...removeUndefinedAndEmpty({
        ...(crewData as Record<string, unknown>),
        phone: normalizePhoneNumber((crewData as any).phone),
      }),
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
      ...removeUndefinedAndEmpty({
        ...(crewData as Record<string, unknown>),
        phone: normalizePhoneNumber((crewData as any).phone),
      }),
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
