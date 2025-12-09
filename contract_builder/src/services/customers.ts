import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Customer } from '@/types/manifestTypes';

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
  async batchImportCustomers(customers: Array<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> & { csvCreatedDate?: string }>): Promise<{ created: number, updated: number, duplicates: number }> {
    try {
      console.log('Starting batch import of', customers.length, 'customers with deduplication');
      let created = 0;
      let updated = 0;
      let duplicates = 0;
      
      // Get all existing customers for duplicate checking
      const existingCustomers = await this.getAllCustomers();
      const existingByDocumentId = new Map(existingCustomers.map(c => [c.documentId, c]));
      
      for (const customerData of customers) {
        const { csvCreatedDate, ...customerFields } = customerData;
        
        // Check for duplicates by documentId ONLY (booking refs can have multiple customers)
        const existingCustomer = existingByDocumentId.get(customerFields.documentId);
        
        if (existingCustomer) {
          // Compare dates to determine which is more recent
          const existingDate = existingCustomer.createdAt;
          const csvDate = csvCreatedDate ? new Date(csvCreatedDate) : null;
          
          let shouldUpdate = false;
          
          if (csvDate && existingDate) {
            // Use CSV date if it's newer than existing
            shouldUpdate = csvDate > existingDate;
          } else if (csvDate) {
            // If we have CSV date but no existing date, use CSV
            shouldUpdate = true;
          } else {
            // If no CSV date, don't update existing
            shouldUpdate = false;
            duplicates++;
          }
          
          if (shouldUpdate) {
            await this.updateCustomer(existingCustomer.id, {
              ...customerFields,
              // Keep the original ID but update everything else
            });
            updated++;
            console.log(`Updated existing customer: ${customerFields.fullName} (newer date: ${csvDate})`);
          } else {
            duplicates++;
            console.log(`Skipped duplicate customer: ${customerFields.fullName} (existing record is newer)`);
          }
        } else {
          // Create new customer
          await addDoc(collection(db, CUSTOMERS_COLLECTION), {
            ...customerFields,
            createdAt: csvCreatedDate ? new Date(csvCreatedDate) : serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          created++;
          console.log(`Created new customer: ${customerFields.fullName}`);
        }
      }
      
      console.log(`Batch import completed: ${created} created, ${updated} updated, ${duplicates} skipped duplicates`);
      return { created, updated, duplicates };
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
