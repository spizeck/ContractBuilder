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
  writeBatch
} from 'firebase/firestore';
import { Timestamp } from "firebase/firestore";
import { db } from '@/lib/firebase';
import type { Gear, GearItem, Customer } from '@/types/manifestTypes';

export type DataPriority = "high" | "medium" | "low";
export type GuestSource = "waiver_import" | "manual" | "checkfront";

// Collections
const CUSTOMERS_COLLECTION = 'customers';

// Customer Services - aligned with spec
export const customerService = {
  async createCustomer(customerData: Omit<Customer, 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const docRef = await addDoc(collection(db, CUSTOMERS_COLLECTION), {
      ...customerData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    const newDoc = await getDoc(docRef);
    return { id: docRef.id, ...newDoc.data() } as Customer;
  },

  async updateCustomer(id: string, updates: Partial<Omit<Customer, 'createdAt'>>): Promise<void> {
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

  async findCustomerByEmail(email: string): Promise<Customer | null> {
    const emailLower = email.toLowerCase().trim();
    const q = query(
      collection(db, CUSTOMERS_COLLECTION),
      where('emailLower', '==', emailLower),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Customer;
  },

  async findCustomerByPhone(phone: string): Promise<Customer | null> {
    // Normalize to E.164 format (basic implementation)
    const phoneE164 = phone.replace(/\D/g, '');
    const q = query(
      collection(db, CUSTOMERS_COLLECTION),
      where('phoneE164', '==', phoneE164),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Customer;
  },

  async searchCustomers(searchTerm: string): Promise<Customer[]> {
    // Search by name, email, or phone
    const searchLower = searchTerm.toLowerCase();
    
    // For now, implement a simple search by name
    // In production, you might want to use Algolia or Firestore's search capabilities
    const q = query(
      collection(db, CUSTOMERS_COLLECTION),
      orderBy('fullName'),
      limit(50)
    );
    
    const querySnapshot = await getDocs(q);
    const allCustomers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Customer);
    
    // Client-side filtering (not ideal for large datasets)
    return allCustomers.filter(customer => 
      customer.fullName.toLowerCase().includes(searchLower) ||
      (customer.emailLower && customer.emailLower.includes(searchLower)) ||
      (customer.phoneE164 && customer.phoneE164.includes(searchTerm.replace(/\D/g, '')))
    );
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

  async getCustomerById(customerId: string): Promise<Customer> {
    const docRef = doc(db, CUSTOMERS_COLLECTION, customerId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Customer not found');
    }
    
    return { id: docSnap.id, ...docSnap.data() } as Customer;
  },

  async bulkCreateCustomers(customersData: Omit<Customer, 'createdAt' | 'updatedAt'>[]): Promise<Customer[]> {
    const batch = writeBatch(db);
    const newCustomers: Customer[] = [];
    
    customersData.forEach(customerData => {
      const docRef = doc(collection(db, CUSTOMERS_COLLECTION));
      const { id: _id, ...customerDataWithoutId } = customerData;
      batch.set(docRef, {
        ...customerDataWithoutId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      newCustomers.push({ id: docRef.id, ...customerDataWithoutId } as Customer);
    });
    
    await batch.commit();
    return newCustomers;
  },

  // Import-specific update methods with verification rules
  
  async updateFromImport(
    customerId: string,
    importData: {
      certLevel?: string;
      certAgencyNumber?: string;
      nitroxCertified?: boolean;
      nitroxCertAgencyNumber?: string;
      lastDiveDate?: string;
      lifetimeDives?: number;
      gearDefault?: Gear;
    },
    importTimestamp: Timestamp
  ): Promise<void> {
    const customer = await this.getCustomer(customerId);
    if (!customer) throw new Error('Customer not found');
    
    const updates: Partial<Customer> = {};
    
    // Certification fields - only update if not verified
    if (!customer.certVerified) {
      if (importData.certLevel !== undefined) updates.certLevel = importData.certLevel;
      if (importData.certAgencyNumber !== undefined) updates.certAgencyNumber = importData.certAgencyNumber;
    }
    
    // Nitrox certification - only update if not verified
    if (!customer.nitroxVerified) {
      if (importData.nitroxCertified !== undefined) updates.nitroxCertified = importData.nitroxCertified;
      if (importData.nitroxCertAgencyNumber !== undefined) updates.nitroxCertAgencyNumber = importData.nitroxCertAgencyNumber;
    }
    
    // Last dive and lifetime dives - only if more recent
    if (importData.lastDiveDate && customer.lastDiveDate) {
      if (importData.lastDiveDate > customer.lastDiveDate) {
        updates.lastDiveDate = importData.lastDiveDate;
        updates.lifetimeDives = importData.lifetimeDives || undefined;
        updates.lastDiveDateSourceAt = importTimestamp;
      }
    } else if (importData.lastDiveDate) {
      // Customer has no last dive date
      updates.lastDiveDate = importData.lastDiveDate;
      updates.lifetimeDives = importData.lifetimeDives || undefined;
      updates.lastDiveDateSourceAt = importTimestamp;
    }
    
    // Gear - update if import is more recent
    if (importData.gearDefault && 
        (!customer.gearLastUpdatedAt || importTimestamp > customer.gearLastUpdatedAt)) {
      updates.gearDefault = importData.gearDefault;
      updates.gearLastUpdatedAt = importTimestamp;
    }
    
    if (Object.keys(updates).length > 0) {
      await this.updateCustomer(customerId, updates);
    }
  },

  // Certification verification methods
  async verifyCertification(
    customerId: string,
    verifiedBy: string
  ): Promise<void> {
    await this.updateCustomer(customerId, {
      certVerified: true,
      certVerifiedAt: Timestamp.now(),
      certVerifiedBy: verifiedBy,
    });
  },

  async verifyNitroxCertification(
    customerId: string,
    verifiedBy: string
  ): Promise<void> {
    await this.updateCustomer(customerId, {
      nitroxVerified: true,
      nitroxVerifiedAt: Timestamp.now(),
      nitroxVerifiedBy: verifiedBy,
    });
  },

  // Gear management
  async updateGearDefault(customerId: string, gear: Gear): Promise<void> {
    await this.updateCustomer(customerId, {
      gearDefault: gear,
      gearLastUpdatedAt: Timestamp.now(),
    });
  },

  // Filter methods for UI
  async getCustomersByCertification(verified: boolean): Promise<Customer[]> {
    const q = query(
      collection(db, CUSTOMERS_COLLECTION),
      where('certVerified', '==', verified),
      orderBy('fullName')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Customer);
  },

  async getCustomersByNitroxCertification(verified: boolean): Promise<Customer[]> {
    const q = query(
      collection(db, CUSTOMERS_COLLECTION),
      where('nitroxVerified', '==', verified),
      orderBy('fullName')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Customer);
  },

  async getCustomersWithRentalGear(): Promise<Customer[]> {
    // This is a simplified query - in production, you might want to denormalize this
    const q = query(
      collection(db, CUSTOMERS_COLLECTION),
      orderBy('fullName'),
      limit(100)
    );
    const querySnapshot = await getDocs(q);
    const allCustomers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Customer);
    
    // Filter clientside for customers who need any rental gear
    return allCustomers.filter(customer => {
      const gear = customer.gearDefault;
      return gear.bcd?.needRental || 
             gear.regulator?.needRental || 
             gear.wetsuit?.needRental || 
             gear.fins?.needRental || 
             gear.mask?.needRental || 
             gear.computer?.needRental;
    });
  },
};

// Utility functions for customer management
export const customerUtils = {
  /**
   * Normalize email to lowercase format
   */
  normalizeEmail(email: string): string | null {
    if (!email || !email.includes('@')) return null;
    return email.toLowerCase().trim();
  },

  /**
   * Normalize phone to E.164 format (basic implementation)
   */
  normalizePhone(phone: string): string | null {
    if (!phone) return null;
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    // Basic validation - adjust based on your requirements
    if (digits.length < 10) return null;
    return digits;
  },

  /**
   * Parse gear from CSV text (simplified implementation)
   */
  parseGearFromImport(rawGear: string): Gear {
    const gear: Gear = {};
    
    // Split by common delimiters
    const items = rawGear.split(/[,;|]/).map(item => item.trim());
    
    items.forEach(item => {
      const isRental = item.toLowerCase().includes('rental') || 
                      item.toLowerCase().includes('need') ||
                      item.toLowerCase().includes('required');
      
      // Extract size if present (e.g., "BCD M/L", "Wetsuit S")
      const sizeMatch = item.match(/\b([xsml]{1,4}(?:\/[xsml]{1,4})?)\b/i);
      const size = sizeMatch ? sizeMatch[1].toUpperCase() : undefined;
      
      if (item.toLowerCase().includes('bcd')) {
        gear.bcd = { needRental: isRental, sizeText: size, sourceText: item };
      } else if (item.toLowerCase().includes('regulator')) {
        gear.regulator = { needRental: isRental, sizeText: size, sourceText: item };
      } else if (item.toLowerCase().includes('wetsuit')) {
        gear.wetsuit = { needRental: isRental, sizeText: size, sourceText: item };
      } else if (item.toLowerCase().includes('fin')) {
        gear.fins = { needRental: isRental, sizeText: size, sourceText: item };
      } else if (item.toLowerCase().includes('mask')) {
        gear.mask = { needRental: isRental, sizeText: size, sourceText: item };
      } else if (item.toLowerCase().includes('computer')) {
        gear.computer = { needRental: isRental, sizeText: size, sourceText: item };
      } else if (item && !gear.otherNotes) {
        gear.otherNotes = item;
      } else if (item && gear.otherNotes) {
        gear.otherNotes += `, ${item}`;
      }
    });
    
    return gear;
  },

  /**
   * Find potential duplicates based on email or phone
   */
  async findPotentialDuplicates(
    email?: string,
    phone?: string
  ): Promise<{ emailMatch?: Customer; phoneMatch?: Customer; conflict?: boolean }> {
    const emailLower = email ? this.normalizeEmail(email) : null;
    const phoneE164 = phone ? this.normalizePhone(phone) : null;
    
    let emailMatch: Customer | undefined;
    let phoneMatch: Customer | undefined;
    
    if (emailLower) {
      emailMatch = await customerService.findCustomerByEmail(emailLower) || undefined;
    }
    
    if (phoneE164) {
      phoneMatch = await customerService.findCustomerByPhone(phoneE164) || undefined;
    }
    
    // Check for conflict (email matches one customer, phone matches another)
    const conflict = emailMatch && phoneMatch && emailMatch.id !== phoneMatch.id;
    
    return { emailMatch, phoneMatch, conflict };
  },
};
