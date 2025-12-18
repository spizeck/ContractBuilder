import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  Timestamp,
  writeBatch,
  DocumentReference
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Customer, 
  DiveSlot, 
  DiveAssignment, 
  TaxiAssignment, 
  Taxi, 
  DailyManifest, 
  DailyTaxiList, 
  ImportJob 
} from '@/types/manifestTypes';
import { Boat } from '@/types/diveLogTypes';

// Collections
const CUSTOMERS_COLLECTION = 'customers';
const DIVE_SLOTS_COLLECTION = 'diveSlots';
const DIVE_ASSIGNMENTS_COLLECTION = 'diveAssignments';
const TAXI_ASSIGNMENTS_COLLECTION = 'taxiAssignments';
const TAXIS_COLLECTION = 'taxis';
const BOATS_COLLECTION = 'boats';
const DAILY_MANIFESTS_COLLECTION = 'dailyManifests';
const DAILY_TAXI_LISTS_COLLECTION = 'dailyTaxiLists';
const IMPORT_JOBS_COLLECTION = 'importJobs';

// Customer Services
export const customerService = {
  async createCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const docRef = await addDoc(collection(db, CUSTOMERS_COLLECTION), {
      ...customerData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    const newDoc = await getDoc(docRef);
    return { id: docRef.id, ...newDoc.data() } as Customer;
  },

  async updateCustomer(id: string, updates: Partial<Omit<Customer, 'id' | 'createdAt'>>): Promise<void> {
    const docRef = doc(db, CUSTOMERS_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteCustomer(id: string): Promise<void> {
    await deleteDoc(doc(db, CUSTOMERS_COLLECTION, id));
  },

  async getCustomer(id: string): Promise<Customer | null> {
    const docSnap = await getDoc(doc(db, CUSTOMERS_COLLECTION, id));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Customer : null;
  },

  async getCustomersByBookingReference(bookingReference: string): Promise<Customer[]> {
    const q = query(
      collection(db, CUSTOMERS_COLLECTION),
      where('bookingReference', '==', bookingReference)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Customer);
  },

  async getAllCustomers(limitCount = 100): Promise<Customer[]> {
    const q = query(
      collection(db, CUSTOMERS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Customer);
  },

  async bulkCreateCustomers(customersData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Customer[]> {
    const batch = writeBatch(db);
    const newCustomers: Customer[] = [];
    
    customersData.forEach(customerData => {
      const docRef = doc(collection(db, CUSTOMERS_COLLECTION));
      batch.set(docRef, {
        ...customerData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      newCustomers.push({ id: docRef.id, ...customerData } as Customer);
    });
    
    await batch.commit();
    return newCustomers;
  },
};

// Dive Slot Services
export const diveSlotService = {
  async createDiveSlot(slotData: Omit<DiveSlot, 'id' | 'createdAt'>): Promise<DiveSlot> {
    const docRef = await addDoc(collection(db, DIVE_SLOTS_COLLECTION), {
      ...slotData,
      createdAt: serverTimestamp(),
    });
    
    const newDoc = await getDoc(docRef);
    return { id: docRef.id, ...newDoc.data() } as DiveSlot;
  },

  async getDiveSlotsByDate(date: Date): Promise<DiveSlot[]> {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    
    const q = query(
      collection(db, DIVE_SLOTS_COLLECTION),
      where('date', '>=', Timestamp.fromDate(startOfDay)),
      where('date', '<', Timestamp.fromDate(endOfDay)),
      orderBy('departureTime')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as DiveSlot);
  },

  async getDiveSlotsByDateAndBoat(date: Date, boatId: string): Promise<DiveSlot[]> {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    
    const q = query(
      collection(db, DIVE_SLOTS_COLLECTION),
      where('date', '>=', Timestamp.fromDate(startOfDay)),
      where('date', '<', Timestamp.fromDate(endOfDay)),
      where('boatId', '==', boatId),
      orderBy('slotNumber')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as DiveSlot);
  },

  async updateDiveSlot(id: string, updates: Partial<Omit<DiveSlot, 'id' | 'createdAt'>>): Promise<void> {
    const docRef = doc(db, DIVE_SLOTS_COLLECTION, id);
    await updateDoc(docRef, updates);
  },
};

// Dive Assignment Services
export const diveAssignmentService = {
  async createAssignment(assignmentData: Omit<DiveAssignment, 'id' | 'assignedAt'>): Promise<DiveAssignment> {
    const docRef = await addDoc(collection(db, DIVE_ASSIGNMENTS_COLLECTION), {
      ...assignmentData,
      assignedAt: serverTimestamp(),
    });
    
    const newDoc = await getDoc(docRef);
    return { id: docRef.id, ...newDoc.data() } as DiveAssignment;
  },

  async getAssignmentsByDiveSlot(diveSlotId: string): Promise<DiveAssignment[]> {
    const q = query(
      collection(db, DIVE_ASSIGNMENTS_COLLECTION),
      where('diveSlotId', '==', diveSlotId),
      orderBy('assignedAt')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as DiveAssignment);
  },

  async getAssignmentsByCustomer(customerId: string): Promise<DiveAssignment[]> {
    const q = query(
      collection(db, DIVE_ASSIGNMENTS_COLLECTION),
      where('customerId', '==', customerId),
      orderBy('assignedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as DiveAssignment);
  },

  async deleteAssignment(id: string): Promise<void> {
    await deleteDoc(doc(db, DIVE_ASSIGNMENTS_COLLECTION, id));
  },

  async getAssignmentsByDate(date: Date): Promise<DiveAssignment[]> {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    
    // Get dive slots for the date, then get assignments for those slots
    const diveSlots = await diveSlotService.getDiveSlotsByDate(date);
    const slotIds = diveSlots.map(slot => slot.id);
    
    if (slotIds.length === 0) return [];
    
    const q = query(
      collection(db, DIVE_ASSIGNMENTS_COLLECTION),
      where('diveSlotId', 'in', slotIds),
      orderBy('assignedAt')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as DiveAssignment);
  },
};

// Taxi Assignment Services
export const taxiAssignmentService = {
  async createTaxiAssignment(assignmentData: Omit<TaxiAssignment, 'id' | 'scheduledAt'>): Promise<TaxiAssignment> {
    const docRef = await addDoc(collection(db, TAXI_ASSIGNMENTS_COLLECTION), {
      ...assignmentData,
      scheduledAt: serverTimestamp(),
    });
    
    const newDoc = await getDoc(docRef);
    return { id: docRef.id, ...newDoc.data() } as TaxiAssignment;
  },

  async getTaxiAssignmentsByDate(date: Date): Promise<TaxiAssignment[]> {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    
    // Get dive slots for the date, then get taxi assignments for those slots
    const diveSlots = await diveSlotService.getDiveSlotsByDate(date);
    const slotIds = diveSlots.map(slot => slot.id);
    
    if (slotIds.length === 0) return [];
    
    const q = query(
      collection(db, TAXI_ASSIGNMENTS_COLLECTION),
      where('diveSlotId', 'in', slotIds),
      orderBy('pickupTime')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as TaxiAssignment);
  },

  async getTaxiAssignmentsByTaxi(taxiId: string, date: Date): Promise<TaxiAssignment[]> {
    const assignments = await this.getTaxiAssignmentsByDate(date);
    return assignments.filter(assignment => assignment.taxiId === taxiId);
  },

  async deleteTaxiAssignment(id: string): Promise<void> {
    await deleteDoc(doc(db, TAXI_ASSIGNMENTS_COLLECTION, id));
  },
};

// Boat Services (extend existing boats service)
export const boatService = {
  async getAllBoats(): Promise<Boat[]> {
    const q = query(
      collection(db, BOATS_COLLECTION),
      where('active', '==', true),
      orderBy('name')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Boat);
  },

  async getBoat(id: string): Promise<Boat | null> {
    const docSnap = await getDoc(doc(db, BOATS_COLLECTION, id));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Boat : null;
  },
};

// Taxi Services
export const taxiService = {
  async getAllTaxis(): Promise<Taxi[]> {
    const q = query(
      collection(db, TAXIS_COLLECTION),
      where('active', '==', true),
      orderBy('name')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Taxi);
  },
};

// Daily Manifest Services
export const dailyManifestService = {
  async createDailyManifest(manifestData: Omit<DailyManifest, 'id' | 'generatedAt'>): Promise<DailyManifest> {
    const docRef = await addDoc(collection(db, DAILY_MANIFESTS_COLLECTION), {
      ...manifestData,
      generatedAt: serverTimestamp(),
    });
    
    const newDoc = await getDoc(docRef);
    return { id: docRef.id, ...newDoc.data() } as DailyManifest;
  },

  async getDailyManifest(date: Date, boatId: string): Promise<DailyManifest | null> {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    
    const q = query(
      collection(db, DAILY_MANIFESTS_COLLECTION),
      where('date', '>=', Timestamp.fromDate(startOfDay)),
      where('date', '<', Timestamp.fromDate(endOfDay)),
      where('boatId', '==', boatId),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as DailyManifest;
  },
};

// Import Job Services
export const importJobService = {
  async createImportJob(jobData: Omit<ImportJob, 'id' | 'createdAt'>): Promise<ImportJob> {
    const docRef = await addDoc(collection(db, IMPORT_JOBS_COLLECTION), {
      ...jobData,
      createdAt: serverTimestamp(),
    });
    
    const newDoc = await getDoc(docRef);
    return { id: docRef.id, ...newDoc.data() } as ImportJob;
  },

  async updateImportJob(id: string, updates: Partial<Omit<ImportJob, 'id' | 'createdAt'>>): Promise<void> {
    const docRef = doc(db, IMPORT_JOBS_COLLECTION, id);
    await updateDoc(docRef, updates);
  },

  async getImportJob(id: string): Promise<ImportJob | null> {
    const docSnap = await getDoc(doc(db, IMPORT_JOBS_COLLECTION, id));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as ImportJob : null;
  },
};

// Utility Functions
export const manifestUtils = {
  calculateTankRequirements(assignments: DiveAssignment[]): { air: number; nitrox: number; total: number } {
    return assignments.reduce(
      (acc, assignment) => {
        if (assignment.tankType === 'nitrox') {
          acc.nitrox++;
        } else {
          acc.air++;
        }
        acc.total++;
        return acc;
      },
      { air: 0, nitrox: 0, total: 0 }
    );
  },

  calculatePickupTime(departureTime: string, hotel: string): string {
    // Different hotels need different pickup times
    const hotelOffsets: { [key: string]: number } = {
      "Sea Saba Resort": 30, // 30 minutes before
      "Other Hotel 1": 45,
      "Other Hotel 2": 60,
    };
    
    const [hours, minutes] = departureTime.split(':').map(Number);
    const offset = hotelOffsets[hotel] || 30;
    
    const pickupMinutes = (hours * 60 + minutes) - offset;
    const pickupHours = Math.floor(pickupMinutes / 60);
    const pickupMins = pickupMinutes % 60;
    
    return `${pickupHours.toString().padStart(2, '0')}:${pickupMins.toString().padStart(2, '0')}`;
  },

  validateCustomerData(customerData: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!customerData.bookingReference?.trim()) {
      errors.push('Booking reference is required');
    }
    
    if (!customerData.firstName?.trim()) {
      errors.push('First name is required');
    }
    
    if (!customerData.lastName?.trim()) {
      errors.push('Last name is required');
    }
    
    if (!customerData.certificationLevel?.trim()) {
      errors.push('Certification level is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },
};
