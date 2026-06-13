'use server'

/**
 * Server-safe Repository Functions for Checkfront Sync
 * 
 * These functions use Firebase Admin SDK to bypass client security rules.
 * Use ONLY in server actions and server-side code.
 * 
 * This duplicates the client-side repo functionality but uses admin Firestore.
 */

import { getAdminDb } from '@/core/db/firebaseAdmin'
import { GroupContract, RoomCategory, DivePackage, MealPackage, Season, Hotel } from '../_types'

const ADMIN_DB = '[FirebaseAdmin]'

// ============================================================================
// Group Contracts
// ============================================================================

export async function getGroupContractByIdServer(
  contractId: string
): Promise<GroupContract | null> {
  console.log('%s getGroupContractByIdServer: %s', ADMIN_DB, contractId)
  
  try {
    const db = getAdminDb()
    const docRef = db.collection('groupContracts').doc(contractId)
    const docSnap = await docRef.get()

    if (!docSnap.exists) {
      console.log('%s Contract not found: %s', ADMIN_DB, contractId)
      return null
    }

    console.log('%s Contract loaded successfully: %s', ADMIN_DB, contractId)
    return { 
      id: docSnap.id, 
      ...docSnap.data() 
    } as GroupContract
  } catch (error) {
    console.error('%s Failed to load contract %s:', ADMIN_DB, contractId, error)
    throw error
  }
}

export async function updateGroupContractServer(
  contractId: string,
  contractData: Partial<GroupContract>
): Promise<void> {
  console.log('%s updateGroupContractServer: %s', ADMIN_DB, contractId, contractData)
  
  try {
    const db = getAdminDb()
    const docRef = db.collection('groupContracts').doc(contractId)
    await docRef.update(contractData)
    console.log('%s Contract updated successfully: %s', ADMIN_DB, contractId)
  } catch (error) {
    console.error('%s Failed to update contract %s:', ADMIN_DB, contractId, error)
    throw error
  }
}

// ============================================================================
// Room Categories
// ============================================================================

export async function getRoomCategoryByIdServer(
  categoryId: string
): Promise<RoomCategory | null> {
  console.log('%s getRoomCategoryByIdServer: %s', ADMIN_DB, categoryId)
  
  try {
    const db = getAdminDb()
    const docRef = db.collection('roomCategories').doc(categoryId)
    const docSnap = await docRef.get()

    if (!docSnap.exists) {
      console.log('%s Room category not found: %s', ADMIN_DB, categoryId)
      return null
    }

    console.log('%s Room category loaded: %s', ADMIN_DB, categoryId)
    return { 
      id: docSnap.id, 
      ...docSnap.data() 
    } as RoomCategory
  } catch (error) {
    console.error('%s Failed to load room category %s:', ADMIN_DB, categoryId, error)
    throw error
  }
}

// ============================================================================
// Dive Packages
// ============================================================================

export async function getDivePackageByIdServer(
  packageId: string
): Promise<DivePackage | null> {
  console.log('%s getDivePackageByIdServer: %s', ADMIN_DB, packageId)
  
  try {
    const db = getAdminDb()
    const docRef = db.collection('divePackages').doc(packageId)
    const docSnap = await docRef.get()

    if (!docSnap.exists) {
      console.log('%s Dive package not found: %s', ADMIN_DB, packageId)
      return null
    }

    console.log('%s Dive package loaded: %s', ADMIN_DB, packageId)
    return { 
      id: docSnap.id, 
      ...docSnap.data() 
    } as DivePackage
  } catch (error) {
    console.error('%s Failed to load dive package %s:', ADMIN_DB, packageId, error)
    throw error
  }
}

// ============================================================================
// Meal Packages
// ============================================================================

export async function getMealPackageByIdServer(
  packageId: string
): Promise<MealPackage | null> {
  console.log('%s getMealPackageByIdServer: %s', ADMIN_DB, packageId)
  
  try {
    const db = getAdminDb()
    const docRef = db.collection('mealPackages').doc(packageId)
    const docSnap = await docRef.get()

    if (!docSnap.exists) {
      console.log('%s Meal package not found: %s', ADMIN_DB, packageId)
      return null
    }

    console.log('%s Meal package loaded: %s', ADMIN_DB, packageId)
    return { 
      id: docSnap.id, 
      ...docSnap.data() 
    } as MealPackage
  } catch (error) {
    console.error('%s Failed to load meal package %s:', ADMIN_DB, packageId, error)
    throw error
  }
}

// ============================================================================
// Bulk Fetch for Inbound Reverse Lookup
// ============================================================================

export async function getAllRoomCategoriesServer(): Promise<RoomCategory[]> {
  console.log('%s getAllRoomCategoriesServer', ADMIN_DB)
  try {
    const db = getAdminDb()
    const snapshot = await db.collection('roomCategories').get()
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as RoomCategory))
  } catch (error) {
    console.error('%s Failed to fetch all room categories:', ADMIN_DB, error)
    throw error
  }
}

export async function getAllDivePackagesServer(): Promise<DivePackage[]> {
  console.log('%s getAllDivePackagesServer', ADMIN_DB)
  try {
    const db = getAdminDb()
    const snapshot = await db.collection('divePackages').get()
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as DivePackage))
  } catch (error) {
    console.error('%s Failed to fetch all dive packages:', ADMIN_DB, error)
    throw error
  }
}

export async function getAllMealPackagesServer(): Promise<MealPackage[]> {
  console.log('%s getAllMealPackagesServer', ADMIN_DB)
  try {
    const db = getAdminDb()
    const snapshot = await db.collection('mealPackages').get()
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MealPackage))
  } catch (error) {
    console.error('%s Failed to fetch all meal packages:', ADMIN_DB, error)
    throw error
  }
}

export async function getSeasonsForHotelServer(hotelId: string): Promise<Season[]> {
  console.log('%s getSeasonsForHotelServer: %s', ADMIN_DB, hotelId)
  try {
    const db = getAdminDb()
    const snapshot = await db
      .collection('seasons')
      .where('hotelId', '==', hotelId)
      .get()
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Season))
  } catch (error) {
    console.error('%s Failed to fetch seasons for hotel %s:', ADMIN_DB, hotelId, error)
    throw error
  }
}

export async function getHotelByIdServer(hotelId: string): Promise<Hotel | null> {
  console.log('%s getHotelByIdServer: %s', ADMIN_DB, hotelId)
  try {
    const db = getAdminDb()
    const docRef = db.collection('hotels').doc(hotelId)
    const docSnap = await docRef.get()
    if (!docSnap.exists) return null
    return { id: docSnap.id, ...docSnap.data() } as Hotel
  } catch (error) {
    console.error('%s Failed to fetch hotel %s:', ADMIN_DB, hotelId, error)
    throw error
  }
}

export async function getGroupContractByCheckfrontBookingIdServer(
  bookingId: string
): Promise<GroupContract | null> {
  console.log('%s getGroupContractByCheckfrontBookingIdServer: %s', ADMIN_DB, bookingId)

  try {
    const db = getAdminDb()
    const snapshot = await db
      .collection('groupContracts')
      .where('checkfrontSync.bookingId', '==', bookingId)
      .limit(1)
      .get()

    if (snapshot.empty) {
      console.log('%s No contract found for checkfront bookingId: %s', ADMIN_DB, bookingId)
      return null
    }

    const doc = snapshot.docs[0]
    console.log('%s Contract found for checkfront bookingId %s: %s', ADMIN_DB, bookingId, doc.id)
    return { id: doc.id, ...doc.data() } as GroupContract
  } catch (error) {
    console.error('%s Failed to query by checkfront bookingId %s:', ADMIN_DB, bookingId, error)
    throw error
  }
}

export async function createGroupContractServer(
  contractData: Omit<GroupContract, 'id'>
): Promise<string> {
  console.log('%s createGroupContractServer for group: %s', ADMIN_DB, contractData.groupName)

  try {
    const db = getAdminDb()
    const docRef = await db.collection('groupContracts').add(contractData)
    console.log('%s GroupContract created: %s', ADMIN_DB, docRef.id)
    return docRef.id
  } catch (error) {
    console.error('%s Failed to create GroupContract:', ADMIN_DB, error)
    throw error
  }
}

// ============================================================================
// Checkfront Sync Logs
// ============================================================================

export interface CheckfrontSyncLogData {
  action: 'create_booking' | 'update_booking' | 'inbound_create' | 'inbound_update'
  success: boolean
  requestSummary?: Record<string, unknown>
  responseSummary?: Record<string, unknown>
  error?: string | null
}

export async function createCheckfrontSyncLogServer(
  contractId: string,
  logData: CheckfrontSyncLogData
): Promise<string> {
  console.log('%s createCheckfrontSyncLogServer for contract: %s', ADMIN_DB, contractId)
  
  try {
    const db = getAdminDb()
    const logsCollection = db
      .collection('groupContracts')
      .doc(contractId)
      .collection('syncLogs')
    
    const docRef = await logsCollection.add({
      ...logData,
      createdAt: new Date(),
    })
    
    console.log('%s Sync log created: %s', ADMIN_DB, docRef.id)
    return docRef.id
  } catch (error) {
    console.error('%s Failed to create sync log for %s:', ADMIN_DB, contractId, error)
    // Don't throw - sync logging should not break the main flow
    return ''
  }
}
