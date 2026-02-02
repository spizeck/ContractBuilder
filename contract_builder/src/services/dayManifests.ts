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
  serverTimestamp,
  Timestamp,
  writeBatch,
  DocumentReference
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { DayManifest, DayRow, TaxiRun, TaxiAssignmentDerived } from '@/types/manifestTypes';

// Collections
const DAY_MANIFESTS_COLLECTION = 'dayManifests';

// Day Manifest Services
export const dayManifestService = {
  // Main manifest document operations
  async getOrCreateDayManifest(date: string): Promise<DayManifest> {
    const docRef = doc(db, DAY_MANIFESTS_COLLECTION, date);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as DayManifest;
    } else {
      // Create new manifest
      const newManifest: Omit<DayManifest, 'id'> = {
        date,
        status: 'draft',
        notes: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      await updateDoc(docRef, newManifest);
      return { id: date, ...newManifest };
    }
  },

  async updateDayManifest(date: string, updates: Partial<Omit<DayManifest, 'id' | 'createdAt'>>): Promise<void> {
    const docRef = doc(db, DAY_MANIFESTS_COLLECTION, date);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  async getDayManifest(date: string): Promise<DayManifest | null> {
    const docRef = doc(db, DAY_MANIFESTS_COLLECTION, date);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as DayManifest : null;
  },

  // Row operations (subcollection)
  async listDayRows(date: string): Promise<DayRow[]> {
    const rowsRef = collection(db, DAY_MANIFESTS_COLLECTION, date, 'rows');
    const q = query(rowsRef, orderBy('createdAt'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as DayRow);
  },

  async getDayRow(date: string, rowId: string): Promise<DayRow | null> {
    const docRef = doc(db, DAY_MANIFESTS_COLLECTION, date, 'rows', rowId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as DayRow : null;
  },

  async upsertDayRow(
    date: string, 
    rowPatch: Partial<DayRow> & { rowId?: string; customerId: string }
  ): Promise<string> {
    const rowsRef = collection(db, DAY_MANIFESTS_COLLECTION, date, 'rows');
    
    if (rowPatch.rowId) {
      // Update existing row
      const docRef = doc(rowsRef, rowPatch.rowId);
      const { rowId, customerId, ...updates } = rowPatch;
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      return rowId;
    } else {
      // Create new row
      const newRow: Omit<DayRow, 'id'> = {
        customerId: rowPatch.customerId,
        stayId: rowPatch.stayId || null,
        d1: rowPatch.d1 || false,
        d2: rowPatch.d2 || false,
        d3: rowPatch.d3 || false,
        nd: rowPatch.nd || false,
        d1BoatId: rowPatch.d1BoatId || null,
        d2BoatId: rowPatch.d2BoatId || null,
        d3BoatId: rowPatch.d3BoatId || null,
        needsTaxi: rowPatch.needsTaxi || false,
        pickupLocationText: rowPatch.pickupLocationText || null,
        dropoffLocationText: rowPatch.dropoffLocationText || null,
        taxiOverride: rowPatch.taxiOverride,
        notes: rowPatch.notes || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(rowsRef, newRow);
      return docRef.id;
    }
  },

  async deleteDayRow(date: string, rowId: string): Promise<void> {
    const docRef = doc(db, DAY_MANIFESTS_COLLECTION, date, 'rows', rowId);
    await deleteDoc(docRef);
  },

  async bulkUpsertDayRows(date: string, rows: Array<Partial<DayRow> & { customerId: string; rowId?: string }>): Promise<string[]> {
    const batch = writeBatch(db);
    const rowIds: string[] = [];
    
    rows.forEach(row => {
      const rowsRef = collection(db, DAY_MANIFESTS_COLLECTION, date, 'rows');
      
      if (row.rowId) {
        // Update existing
        const docRef = doc(rowsRef, row.rowId);
        const { rowId, customerId, ...updates } = row;
        batch.update(docRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        });
        rowIds.push(row.rowId);
      } else {
        // Create new
        const docRef = doc(rowsRef);
        const newRow: Omit<DayRow, 'id'> = {
          customerId: row.customerId,
          stayId: row.stayId || null,
          d1: row.d1 || false,
          d2: row.d2 || false,
          d3: row.d3 || false,
          nd: row.nd || false,
          d1BoatId: row.d1BoatId || null,
          d2BoatId: row.d2BoatId || null,
          d3BoatId: row.d3BoatId || null,
          needsTaxi: row.needsTaxi || false,
          pickupLocationText: row.pickupLocationText || null,
          dropoffLocationText: row.dropoffLocationText || null,
          taxiOverride: row.taxiOverride,
          notes: row.notes || null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        batch.set(docRef, newRow);
        rowIds.push(docRef.id);
      }
    });
    
    await batch.commit();
    return rowIds;
  },

  // Taxi Run operations (subcollection)
  async ensureDefaultTaxiRuns(date: string): Promise<void> {
    const runsRef = collection(db, DAY_MANIFESTS_COLLECTION, date, 'taxiRuns');
    const existingSnapshot = await getDocs(runsRef);
    
    if (!existingSnapshot.empty) {
      return; // Already has runs
    }
    
    // Seed default runs
    const defaultRuns = [
      // To Harbor
      { direction: 'to_harbor' as const, timeLocal: '08:30', isDefault: true },
      { direction: 'to_harbor' as const, timeLocal: '10:15', isDefault: true },
      { direction: 'to_harbor' as const, timeLocal: '12:30', isDefault: true },
      // From Harbor
      { direction: 'from_harbor' as const, timeLocal: '10:45', isDefault: true },
      { direction: 'from_harbor' as const, timeLocal: '13:00', isDefault: true },
      { direction: 'from_harbor' as const, timeLocal: '15:00', isDefault: true },
    ];
    
    const batch = writeBatch(db);
    defaultRuns.forEach((run, index) => {
      const docRef = doc(runsRef);
      batch.set(docRef, {
        ...run,
        sortIndex: index,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    
    await batch.commit();
  },

  async listTaxiRuns(date: string, direction?: 'to_harbor' | 'from_harbor'): Promise<TaxiRun[]> {
    const runsRef = collection(db, DAY_MANIFESTS_COLLECTION, date, 'taxiRuns');
    let q = query(runsRef);
    
    if (direction) {
      q = query(runsRef, where('direction', '==', direction));
    }
    
    const querySnapshot = await getDocs(q);
    const runs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as TaxiRun);
    
    // Sort by sortIndex if available, otherwise by time
    return runs.sort((a, b) => {
      if (a.sortIndex !== undefined && b.sortIndex !== undefined) {
        return a.sortIndex - b.sortIndex;
      }
      return a.timeLocal.localeCompare(b.timeLocal);
    });
  },

  async createTaxiRun(
    date: string, 
    run: { direction: 'to_harbor' | 'from_harbor'; timeLocal: string; label?: string; isDefault?: boolean }
  ): Promise<string> {
    const runsRef = collection(db, DAY_MANIFESTS_COLLECTION, date, 'taxiRuns');
    
    // Get next sortIndex
    const existingRuns = await this.listTaxiRuns(date);
    const nextSortIndex = Math.max(...existingRuns.map(r => r.sortIndex || 0), -1) + 1;
    
    const newRun: Omit<TaxiRun, 'id'> = {
      direction: run.direction,
      timeLocal: run.timeLocal,
      label: run.label,
      isDefault: run.isDefault || false,
      sortIndex: nextSortIndex,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(runsRef, newRun);
    return docRef.id;
  },

  async updateTaxiRun(date: string, runId: string, patch: Partial<TaxiRun>): Promise<void> {
    const docRef = doc(db, DAY_MANIFESTS_COLLECTION, date, 'taxiRuns', runId);
    await updateDoc(docRef, {
      ...patch,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteTaxiRun(date: string, runId: string): Promise<void> {
    const docRef = doc(db, DAY_MANIFESTS_COLLECTION, date, 'taxiRuns', runId);
    await deleteDoc(docRef);
  },

  // Publish/complete operations
  async publishDayManifest(date: string): Promise<void> {
    await this.updateDayManifest(date, { status: 'published' });
  },

  async completeDayManifest(date: string): Promise<void> {
    await this.updateDayManifest(date, { status: 'completed' });
  },
};

// Taxi derivation utilities
export const taxiUtils = {
  // Derive pickup/dropoff times based on dive selections
  deriveTaxiRuns(row: DayRow): { pickupRun: string | null; dropoffRun: string | null } {
    if (row.nd || (!row.d1 && !row.d2 && !row.d3)) {
      return { pickupRun: null, dropoffRun: null };
    }
    
    // Find earliest and latest dives
    const dives = [];
    if (row.d1) dives.push(1);
    if (row.d2) dives.push(2);
    if (row.d3) dives.push(3);
    
    const earliest = Math.min(...dives);
    const latest = Math.max(...dives);
    
    // Map to default run times
    const pickupMap = {
      1: '08:30',
      2: '10:15',
      3: '12:30',
    };
    
    const dropoffMap = {
      1: '10:45',
      2: '13:00',
      3: '15:00',
    };
    
    return {
      pickupRun: pickupMap[earliest as keyof typeof pickupMap],
      dropoffRun: dropoffMap[latest as keyof typeof dropoffMap],
    };
  },

  // Generate derived taxi assignments for UI
  async deriveTaxiAssignments(
    date: string, 
    rows: DayRow[], 
    taxiRuns: TaxiRun[],
    customerNames: Record<string, string>
  ): Promise<TaxiAssignmentDerived[]> {
    const assignments: TaxiAssignmentDerived[] = [];
    
    // Group runs by direction
    const pickupRuns = taxiRuns.filter(r => r.direction === 'to_harbor');
    const dropoffRuns = taxiRuns.filter(r => r.direction === 'from_harbor');
    
    for (const row of rows) {
      // Skip if no taxi needed or override says no taxi
      if (!row.needsTaxi || row.taxiOverride?.noTaxiToday) {
        continue;
      }
      
      // Get derived runs
      const derived = this.deriveTaxiRuns(row);
      
      // Apply overrides if present
      const pickupTime = row.taxiOverride?.pickupRunId || 
        pickupRuns.find(r => r.timeLocal === derived.pickupRun)?.timeLocal;
      const dropoffTime = row.taxiOverride?.dropoffRunId || 
        dropoffRuns.find(r => r.timeLocal === derived.dropoffRun)?.timeLocal;
      
      if (pickupTime || dropoffTime) {
        assignments.push({
          customerId: row.customerId,
          customerName: customerNames[row.customerId] || 'Unknown',
          pickupRunId: pickupTime,
          pickupTime: pickupTime || '',
          pickupLocation: row.pickupLocationText || '',
          dropoffRunId: dropoffTime,
          dropoffTime: dropoffTime || '',
          dropoffLocation: row.dropoffLocationText || row.pickupLocationText || '',
          notes: row.notes || undefined,
          boats: [row.d1BoatId, row.d2BoatId, row.d3BoatId].filter(Boolean) as string[],
        });
      }
    }
    
    return assignments;
  },
};
