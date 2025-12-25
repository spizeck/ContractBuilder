import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Customer } from '@/types/manifestTypes';
import { processBatchImport, type CustomerWithCsvDate } from '@/utils/parsers';

const CUSTOMERS_COLLECTION = 'customers';

export const customerService = {
  // Get all customers
  async getAllCustomers(): Promise<Customer[]> {
    try {
      console.log('Fetching customers from collection:', CUSTOMERS_COLLECTION);
      const q = query(collection(db, CUSTOMERS_COLLECTION), orderBy('fullName'));
      const querySnapshot = await getDocs(q);
      console.log('Query successful, found', querySnapshot.docs.length, 'customers');
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Customer[];
    } catch (error) {
      console.error('Customer service error:', error);
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

  // Get customer by ID
  async getCustomerById(id: string): Promise<Customer | null> {
    const docRef = doc(db, CUSTOMERS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate(),
        updatedAt: docSnap.data().updatedAt?.toDate()
      } as Customer;
    }
    return null;
  },

  // Add single customer
  async addCustomer(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, CUSTOMERS_COLLECTION), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log('Customer added with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding customer:', error);
      throw error;
    }
  },

  // Update customer
  async updateCustomer(id: string, data: Partial<Customer>): Promise<void> {
    try {
      const docRef = doc(db, CUSTOMERS_COLLECTION, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
      console.log('Customer updated with ID:', id);
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  },

  // Delete customer
  async deleteCustomer(id: string): Promise<void> {
    try {
      const docRef = doc(db, CUSTOMERS_COLLECTION, id);
      await deleteDoc(docRef);
      console.log('Customer deleted with ID:', id);
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  },

  // Batch import customers with duplicate prevention (for CSV import)
  async batchImportCustomers(customers: Array<CustomerWithCsvDate>): Promise<{ created: number, updated: number, duplicates: number }> {
    try {
      console.log('Starting batch import of', customers.length, 'customers with deduplication');
      
      // Get all existing customers for duplicate checking
      const existingCustomers = await this.getAllCustomers();
      
      // Use the centralized batch import logic
      const result = await processBatchImport(
        customers,
        existingCustomers,
        (id: string, data: Partial<Customer>) => this.updateCustomer(id, data),
        (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => this.addCustomer(data)
      );
      
      console.log(`Batch import completed: ${result.created} created, ${result.updated} updated, ${result.duplicates} duplicates skipped`);
      return result;
    } catch (error) {
      console.error('Error in batch import:', error);
      throw error;
    }
  },

  // Search customers by booking reference or name
  async searchCustomers(query: string): Promise<Customer[]> {
    try {
      console.log('Searching customers with query:', query);
      const allCustomers = await this.getAllCustomers();
      const lowerQuery = query.toLowerCase();
      
      const filtered = allCustomers.filter(customer =>
        customer.bookingReference.toLowerCase().includes(lowerQuery) ||
        customer.documentId.toLowerCase().includes(lowerQuery) ||
        customer.fullName.toLowerCase().includes(lowerQuery) ||
        customer.email?.toLowerCase().includes(lowerQuery) ||
        customer.accommodations?.toLowerCase().includes(lowerQuery)
      );
      
      console.log('Search found', filtered.length, 'customers');
      return filtered;
    } catch (error) {
      console.error('Error searching customers:', error);
      throw error;
    }
  }
};
