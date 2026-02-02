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
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Stay, Gear } from '@/types/manifestTypes';

// Collections
const STAYS_COLLECTION = 'stays';

// Stay Services
export const stayService = {
  async createStay(stayData: Omit<Stay, 'id' | 'createdAt' | 'updatedAt'>): Promise<Stay> {
    const docRef = await addDoc(collection(db, STAYS_COLLECTION), {
      ...stayData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    const newDoc = await getDoc(docRef);
    return { id: docRef.id, ...newDoc.data() } as Stay;
  },

  async updateStay(id: string, updates: Partial<Omit<Stay, 'id' | 'createdAt'>>): Promise<void> {
    const docRef = doc(db, STAYS_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteStay(id: string): Promise<void> {
    await deleteDoc(doc(db, STAYS_COLLECTION, id));
  },

  async getStay(id: string): Promise<Stay | null> {
    const docSnap = await getDoc(doc(db, STAYS_COLLECTION, id));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Stay : null;
  },

  async getStaysByCustomerId(customerId: string): Promise<Stay[]> {
    const q = query(
      collection(db, STAYS_COLLECTION),
      where('customerId', '==', customerId),
      orderBy('arrivalDate', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Stay);
  },

  async getStaysByDateRange(startDate: string, endDate: string): Promise<Stay[]> {
    const q = query(
      collection(db, STAYS_COLLECTION),
      where('arrivalDate', '<=', endDate),
      where('departureDate', '>=', startDate),
      orderBy('arrivalDate')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Stay);
  },

  async getStaysByDate(date: string): Promise<Stay[]> {
    // Returns stays that are active on the given date
    const q = query(
      collection(db, STAYS_COLLECTION),
      where('arrivalDate', '<=', date),
      where('departureDate', '>=', date),
      where('status', '!=', 'checked_out'),
      orderBy('arrivalDate')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Stay);
  },

  async getStaysByBookingCode(bookingCode: string): Promise<Stay[]> {
    const q = query(
      collection(db, STAYS_COLLECTION),
      where('bookingCode', '==', bookingCode)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Stay);
  },

  async getStaysByExternalDocId(externalDocId: string): Promise<Stay[]> {
    const q = query(
      collection(db, STAYS_COLLECTION),
      where('externalDocId', '==', externalDocId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Stay);
  },

  async getInHouseStays(): Promise<Stay[]> {
    const q = query(
      collection(db, STAYS_COLLECTION),
      where('status', '==', 'in_house'),
      orderBy('arrivalDate')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Stay);
  },

  async getStaysByStatus(status: Stay['status']): Promise<Stay[]> {
    const q = query(
      collection(db, STAYS_COLLECTION),
      where('status', '==', status),
      orderBy('arrivalDate')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Stay);
  },

  async upsertStayByBookingCode(
    customerId: string, 
    bookingCode: string, 
    stayData: Omit<Stay, 'id' | 'createdAt' | 'updatedAt' | 'customerId' | 'bookingCode'>
  ): Promise<Stay> {
    // First try to find existing stay by bookingCode + customerId
    const existing = await this.getStaysByBookingCode(bookingCode);
    const existingForCustomer = existing.find(stay => stay.customerId === customerId);
    
    if (existingForCustomer) {
      await this.updateStay(existingForCustomer.id!, stayData);
      return { ...existingForCustomer, ...stayData };
    } else {
      // Create new stay
      return this.createStay({
        ...stayData,
        customerId,
        bookingCode,
      });
    }
  },

  async upsertStayByExternalDocId(
    externalDocId: string,
    stayData: Omit<Stay, 'id' | 'createdAt' | 'updatedAt' | 'externalDocId'>
  ): Promise<Stay> {
    // First try to find existing stay by externalDocId
    const existing = await this.getStaysByExternalDocId(externalDocId);
    
    if (existing.length > 0) {
      // Update first match (should be unique)
      await this.updateStay(existing[0].id!, stayData);
      return { ...existing[0], ...stayData };
    } else {
      // Create new stay
      return this.createStay({
        ...stayData,
        externalDocId,
        customerId: stayData.customerId, // Must be provided
      });
    }
  },

  async bulkCreateStays(staysData: Omit<Stay, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Stay[]> {
    const batch = writeBatch(db);
    const newStays: Stay[] = [];
    
    staysData.forEach(stayData => {
      const docRef = doc(collection(db, STAYS_COLLECTION));
      batch.set(docRef, {
        ...stayData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      newStays.push({ id: docRef.id, ...stayData } as Stay);
    });
    
    await batch.commit();
    return newStays;
  },

  async checkOutStay(id: string): Promise<void> {
    const docRef = doc(db, STAYS_COLLECTION, id);
    await updateDoc(docRef, {
      status: 'checked_out',
      checkedOutAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  async checkInStay(id: string): Promise<void> {
    const docRef = doc(db, STAYS_COLLECTION, id);
    await updateDoc(docRef, {
      status: 'in_house',
      updatedAt: serverTimestamp(),
    });
  },
};

// Utility functions for stay management
export const stayUtils = {
  isStayActiveOnDate(stay: Stay, date: string): boolean {
    return stay.arrivalDate <= date && stay.departureDate >= date && stay.status !== 'checked_out';
  },

  getStayDuration(stay: Stay): number {
    const arrival = new Date(stay.arrivalDate);
    const departure = new Date(stay.departureDate);
    const diffTime = Math.abs(departure.getTime() - arrival.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both days
  },

  parseGearFromImport(rawGear: string): Gear {
    // MVP parsing: detect "Rental" vs "I have my own"
    const gear: Gear = {};
    
    // This is a simplified parser - you'll want to enhance this based on your actual CSV format
    const items = rawGear.split(',').map(item => item.trim());
    
    items.forEach(item => {
      const isRental = item.toLowerCase().includes('rental');
      
      if (item.toLowerCase().includes('bcd')) {
        gear.bcd = { needRental: isRental, sourceText: item };
      } else if (item.toLowerCase().includes('regulator')) {
        gear.regulator = { needRental: isRental, sourceText: item };
      } else if (item.toLowerCase().includes('wetsuit')) {
        gear.wetsuit = { needRental: isRental, sourceText: item };
      } else if (item.toLowerCase().includes('fins')) {
        gear.fins = { needRental: isRental, sourceText: item };
      } else if (item.toLowerCase().includes('mask')) {
        gear.mask = { needRental: isRental, sourceText: item };
      } else if (item.toLowerCase().includes('computer')) {
        gear.computer = { needRental: isRental, sourceText: item };
      } else {
        gear.otherNotes = gear.otherNotes ? `${gear.otherNotes}, ${item}` : item;
      }
    });
    
    return gear;
  },
};
