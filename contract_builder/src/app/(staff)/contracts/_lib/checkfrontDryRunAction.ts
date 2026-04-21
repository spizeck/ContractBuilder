'use server'

/**
 * Server Action for Checkfront Dry-Run Testing
 *
 * This file must only be imported in server contexts or called as a Server Action.
 * Never import this directly in client components.
 *
 * This action performs a SAFE dry-run that:
 * - Resolves all Checkfront item mappings without creating any bookings
 * - Logs detailed debug information
 * - Optionally performs rated item API calls (read-only)
 * - NEVER creates a booking
 */

import {
  getGroupContractByIdServer,
  getRoomCategoryByIdServer,
  getDivePackageByIdServer,
  getMealPackageByIdServer,
} from './checkfrontServerRepos'
import { GroupContract, RoomSelection } from '../_types'

// ============================================================================
// Types
// ============================================================================

export interface DryRunLineResult {
  lineType: 'room' | 'divePackage' | 'mealPackage'
  lineIndex: number
  // Room-specific fields
  roomCategoryId?: string
  roomCategoryName?: string
  occupancy?: string
  quantity?: number
  // Package-specific fields
  packageId?: string
  packageName?: string
  // Resolution result
  resolvedCheckfrontItemId?: string | null
  missingMapping: boolean
  // Rated call result (if attempted)
  ratedCallAttempted?: boolean
  ratedCallSuccess?: boolean
  ratedCallError?: string
}

export interface CheckfrontDryRunResult {
  success: boolean
  contractId: string
  hotelId: string
  contractName: string
  totalLines: number
  resolvedLines: DryRunLineResult[]
  missingMappingsCount: number
  warnings: string[]
  errors: string[]
  // Summary
  roomLines: number
  roomLinesResolved: number
  divePackageResolved: boolean
  mealPackageResolved: boolean
  // Rated call summary (if attempted)
  ratedCallsAttempted: number
  ratedCallsSuccessful: number
  // Debug info
  logDetails: {
    timestamp: string
    contractLoaded: boolean
    categoriesLoaded: number
    divePackageLoaded: boolean
    mealPackageLoaded: boolean
  }
}

// ============================================================================
// Server-safe wrappers with error handling
// ============================================================================

async function getRoomCategorySafe(categoryId: string) {
  try {
    return await getRoomCategoryByIdServer(categoryId)
  } catch (error) {
    console.error('[CheckfrontDryRun] Failed to load room category %s:', categoryId, error)
    return null
  }
}

// ============================================================================
// Main Dry-Run Action
// ============================================================================

/**
 * Perform a dry-run Checkfront sync test.
 * Resolves all mappings without creating any bookings.
 */
export async function checkfrontDryRunAction(
  contractId: string
): Promise<CheckfrontDryRunResult> {
  const timestamp = new Date().toISOString()
  const warnings: string[] = []
  const errors: string[] = []
  const resolvedLines: DryRunLineResult[] = []

  console.log('[CheckfrontDryRun] Starting dry-run for contract: %s', contractId)

  // Default result structure for early returns
  const createEmptyResult = (): CheckfrontDryRunResult => ({
    success: false,
    contractId,
    hotelId: '',
    contractName: '',
    totalLines: 0,
    resolvedLines: [],
    missingMappingsCount: 0,
    warnings,
    errors,
    roomLines: 0,
    roomLinesResolved: 0,
    divePackageResolved: false,
    mealPackageResolved: false,
    ratedCallsAttempted: 0,
    ratedCallsSuccessful: 0,
    logDetails: {
      timestamp,
      contractLoaded: false,
      categoriesLoaded: 0,
      divePackageLoaded: false,
      mealPackageLoaded: false,
    },
  })

  try {
    // 1. Load contract from Firestore using server-safe admin SDK
    console.log('[CheckfrontDryRun] Loading contract via admin SDK: %s', contractId)
    const contract = await getGroupContractByIdServer(contractId)

    if (!contract) {
      errors.push(`Contract not found: ${contractId}`)
      console.error('[CheckfrontDryRun] Contract not found: %s', contractId)
      return {
        ...createEmptyResult(),
        errors,
      }
    }

    console.log(`[CheckfrontDryRun] Contract loaded: ${contract.groupName} (${contract.hotelId})`)

    let categoriesLoaded = 0
    let divePackageLoaded = false
    let mealPackageLoaded = false

    // 2. Resolve room lines
    if (contract.rooms && contract.rooms.length > 0) {
      console.log(`[CheckfrontDryRun] Resolving ${contract.rooms.length} room lines...`)

      for (let i = 0; i < contract.rooms.length; i++) {
        const room = contract.rooms[i]

        if (room.numRooms <= 0) {
          warnings.push(`Room line ${i + 1}: Zero rooms, skipping`)
          continue
        }

        // Load room category using server-safe admin SDK
        const category = await getRoomCategorySafe(room.categoryId)
        categoriesLoaded++

        if (!category) {
          errors.push(`Room line ${i + 1}: Room category not found: ${room.categoryId}`)
          resolvedLines.push({
            lineType: 'room',
            lineIndex: i,
            roomCategoryId: room.categoryId,
            roomCategoryName: 'UNKNOWN',
            occupancy: room.occupancyType,
            quantity: room.numRooms,
            resolvedCheckfrontItemId: null,
            missingMapping: true,
          })
          continue
        }

        // Resolve Checkfront item ID from category.checkfrontItemIds[occupancy]
        const checkfrontItemId = category.checkfrontItemIds?.[room.occupancyType as keyof typeof category.checkfrontItemIds]
        const missingMapping = !checkfrontItemId

        if (missingMapping) {
          errors.push(
            `Missing Checkfront room mapping for category "${category.name}" occupancy "${room.occupancyType}"`
          )
        }

        resolvedLines.push({
          lineType: 'room',
          lineIndex: i,
          roomCategoryId: room.categoryId,
          roomCategoryName: category.name,
          occupancy: room.occupancyType,
          quantity: room.numRooms,
          resolvedCheckfrontItemId: checkfrontItemId || null,
          missingMapping,
        })

        console.log(
          `[CheckfrontDryRun] Room line ${i + 1}: ${category.name} / ${room.occupancyType} => ` +
          `Item ID: ${checkfrontItemId || 'MISSING'}`
        )
      }
    }

    // 3. Resolve dive package
    if (contract.divePackageId) {
      console.log(`[CheckfrontDryRun] Resolving dive package: ${contract.divePackageId}`)

      const divePackage = await getDivePackageByIdServer(contract.divePackageId)
      divePackageLoaded = true

      if (!divePackage) {
        errors.push(`Dive package not found: ${contract.divePackageId}`)
      } else {
        const checkfrontItemId = divePackage.checkfrontItemId
        const missingMapping = !checkfrontItemId

        if (missingMapping) {
          errors.push(`Missing Checkfront mapping for dive package "${divePackage.name}"`)
        }

        resolvedLines.push({
          lineType: 'divePackage',
          lineIndex: resolvedLines.length,
          packageId: divePackage.id,
          packageName: divePackage.name,
          quantity: contract.numDivers || contract.totalGuests || 1,
          resolvedCheckfrontItemId: checkfrontItemId || null,
          missingMapping,
        })

        console.log(
          `[CheckfrontDryRun] Dive package: ${divePackage.name} => ` +
          `Item ID: ${checkfrontItemId || 'MISSING'}`
        )
      }
    }

    // 4. Resolve meal package
    if (contract.mealPackageId) {
      console.log(`[CheckfrontDryRun] Resolving meal package: ${contract.mealPackageId}`)

      const mealPackage = await getMealPackageByIdServer(contract.mealPackageId)
      mealPackageLoaded = true

      if (!mealPackage) {
        errors.push(`Meal package not found: ${contract.mealPackageId}`)
      } else {
        const checkfrontItemId = mealPackage.checkfrontItemId
        const missingMapping = !checkfrontItemId

        if (missingMapping) {
          errors.push(`Missing Checkfront mapping for meal package "${mealPackage.name}"`)
        }

        resolvedLines.push({
          lineType: 'mealPackage',
          lineIndex: resolvedLines.length,
          packageId: mealPackage.id,
          packageName: mealPackage.name,
          quantity: contract.totalGuests || 1,
          resolvedCheckfrontItemId: checkfrontItemId || null,
          missingMapping,
        })

        console.log(
          `[CheckfrontDryRun] Meal package: ${mealPackage.name} => ` +
          `Item ID: ${checkfrontItemId || 'MISSING'}`
        )
      }
    }

    // 5. Calculate summary stats
    const roomLines = resolvedLines.filter(l => l.lineType === 'room')
    const roomLinesResolved = roomLines.filter(l => !l.missingMapping).length
    const divePackageResolved = resolvedLines.some(
      l => l.lineType === 'divePackage' && !l.missingMapping
    )
    const mealPackageResolved = resolvedLines.some(
      l => l.lineType === 'mealPackage' && !l.missingMapping
    )
    const missingMappingsCount = resolvedLines.filter(l => l.missingMapping).length

    // TODO: Rated item API calls (Phase 2 enhancement)
    // These would call Checkfront's rated item endpoint to validate item IDs
    // without creating a booking. Keeping this as a placeholder for now.
    const ratedCallsAttempted = 0
    const ratedCallsSuccessful = 0

    // 6. Build result
    const result: CheckfrontDryRunResult = {
      success: missingMappingsCount === 0 && errors.length === 0,
      contractId,
      hotelId: contract.hotelId,
      contractName: contract.groupName,
      totalLines: resolvedLines.length,
      resolvedLines,
      missingMappingsCount,
      warnings,
      errors,
      roomLines: roomLines.length,
      roomLinesResolved,
      divePackageResolved,
      mealPackageResolved,
      ratedCallsAttempted,
      ratedCallsSuccessful,
      logDetails: {
        timestamp,
        contractLoaded: true,
        categoriesLoaded,
        divePackageLoaded,
        mealPackageLoaded,
      },
    }

    // 7. Log full result to console for debugging
    console.log('[CheckfrontDryRun] === RESULT ===')
    console.log(`Contract: ${result.contractName} (${result.contractId})`)
    console.log(`Success: ${result.success}`)
    console.log(`Total lines: ${result.totalLines}`)
    console.log(`Missing mappings: ${result.missingMappingsCount}`)
    console.log(`Room lines: ${result.roomLinesResolved}/${result.roomLines} resolved`)
    console.log(`Dive package: ${result.divePackageResolved ? 'OK' : 'MISSING'}`)
    console.log(`Meal package: ${result.mealPackageResolved ? 'OK' : 'MISSING'}`)
    if (warnings.length > 0) {
      console.log('Warnings:', warnings)
    }
    if (errors.length > 0) {
      console.log('Errors:', errors)
    }
    console.log('Full details:', result)
    console.log('[CheckfrontDryRun] === END ===')

    return result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[CheckfrontDryRun] Fatal error:', errorMessage)
    errors.push(`Dry-run failed: ${errorMessage}`)

    return {
      ...createEmptyResult(),
      errors,
    }
  }
}
