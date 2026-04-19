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
import { GroupContract, RoomCategory, DivePackage, MealPackage } from '../_types'

const ADMIN_DB = '[FirebaseAdmin]'

// ============================================================================
// Group Contracts
// ============================================================================

export async function getGroupContractByIdServer(
  contractId: string
): Promise<GroupContract | null> {
  console.log(`${ADMIN_DB} getGroupContractByIdServer: ${contractId}`)
  
  try {
    const db = getAdminDb()
    const docRef = db.collection('groupContracts').doc(contractId)
    const docSnap = await docRef.get()

    if (!docSnap.exists) {
      console.log(`${ADMIN_DB} Contract not found: ${contractId}`)
      return null
    }

    console.log(`${ADMIN_DB} Contract loaded successfully: ${contractId}`)
    return { 
      id: docSnap.id, 
      ...docSnap.data() 
    } as GroupContract
  } catch (error) {
    console.error(`${ADMIN_DB} Failed to load contract ${contractId}:`, error)
    throw error
  }
}

export async function updateGroupContractServer(
  contractId: string,
  contractData: Partial<GroupContract>
): Promise<void> {
  console.log(`${ADMIN_DB} updateGroupContractServer: ${contractId}`, contractData)
  
  try {
    const db = getAdminDb()
    const docRef = db.collection('groupContracts').doc(contractId)
    await docRef.update(contractData)
    console.log(`${ADMIN_DB} Contract updated successfully: ${contractId}`)
  } catch (error) {
    console.error(`${ADMIN_DB} Failed to update contract ${contractId}:`, error)
    throw error
  }
}

// ============================================================================
// Room Categories
// ============================================================================

export async function getRoomCategoryByIdServer(
  categoryId: string
): Promise<RoomCategory | null> {
  console.log(`${ADMIN_DB} getRoomCategoryByIdServer: ${categoryId}`)
  
  try {
    const db = getAdminDb()
    const docRef = db.collection('roomCategories').doc(categoryId)
    const docSnap = await docRef.get()

    if (!docSnap.exists) {
      console.log(`${ADMIN_DB} Room category not found: ${categoryId}`)
      return null
    }

    console.log(`${ADMIN_DB} Room category loaded: ${categoryId}`)
    return { 
      id: docSnap.id, 
      ...docSnap.data() 
    } as RoomCategory
  } catch (error) {
    console.error(`${ADMIN_DB} Failed to load room category ${categoryId}:`, error)
    throw error
  }
}

// ============================================================================
// Dive Packages
// ============================================================================

export async function getDivePackageByIdServer(
  packageId: string
): Promise<DivePackage | null> {
  console.log(`${ADMIN_DB} getDivePackageByIdServer: ${packageId}`)
  
  try {
    const db = getAdminDb()
    const docRef = db.collection('divePackages').doc(packageId)
    const docSnap = await docRef.get()

    if (!docSnap.exists) {
      console.log(`${ADMIN_DB} Dive package not found: ${packageId}`)
      return null
    }

    console.log(`${ADMIN_DB} Dive package loaded: ${packageId}`)
    return { 
      id: docSnap.id, 
      ...docSnap.data() 
    } as DivePackage
  } catch (error) {
    console.error(`${ADMIN_DB} Failed to load dive package ${packageId}:`, error)
    throw error
  }
}

// ============================================================================
// Meal Packages
// ============================================================================

export async function getMealPackageByIdServer(
  packageId: string
): Promise<MealPackage | null> {
  console.log(`${ADMIN_DB} getMealPackageByIdServer: ${packageId}`)
  
  try {
    const db = getAdminDb()
    const docRef = db.collection('mealPackages').doc(packageId)
    const docSnap = await docRef.get()

    if (!docSnap.exists) {
      console.log(`${ADMIN_DB} Meal package not found: ${packageId}`)
      return null
    }

    console.log(`${ADMIN_DB} Meal package loaded: ${packageId}`)
    return { 
      id: docSnap.id, 
      ...docSnap.data() 
    } as MealPackage
  } catch (error) {
    console.error(`${ADMIN_DB} Failed to load meal package ${packageId}:`, error)
    throw error
  }
}

// ============================================================================
// Checkfront Sync Logs
// ============================================================================

export interface CheckfrontSyncLogData {
  action: 'create_booking' | 'update_booking'
  success: boolean
  requestSummary?: Record<string, unknown>
  responseSummary?: Record<string, unknown>
  error?: string | null
}

export async function createCheckfrontSyncLogServer(
  contractId: string,
  logData: CheckfrontSyncLogData
): Promise<string> {
  console.log(`${ADMIN_DB} createCheckfrontSyncLogServer for contract: ${contractId}`)
  
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
    
    console.log(`${ADMIN_DB} Sync log created: ${docRef.id}`)
    return docRef.id
  } catch (error) {
    console.error(`${ADMIN_DB} Failed to create sync log for ${contractId}:`, error)
    // Don't throw - sync logging should not break the main flow
    return ''
  }
}
