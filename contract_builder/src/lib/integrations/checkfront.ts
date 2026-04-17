/**
 * Checkfront Integration Service - Phase 2 Implementation
 *
 * Server-side only module for Checkfront API interactions.
 * DO NOT import this in client components - credentials must remain server-side.
 *
 * Checkfront API Flow:
 * 1. Create/retrieve customer -> customer_id
 * 2. Create session (represents a booking inquiry) -> session_id
 * 3. Add items (rooms, dives, meals) to session as "slips" -> item_id + slip_id
 * 4. Create booking from session -> booking_id
 * 5. For updates: POST /booking/{booking_id}/update
 *
 * Environment Variables Required:
 * - CHECKFRONT_API_BASE_URL
 * - CHECKFRONT_API_KEY
 * - CHECKFRONT_API_SECRET
 */

import {
  GroupContract,
  CheckfrontSyncInfo,
  CheckfrontItemMapping,
} from '@/app/(staff)/contracts/_types'
import {
  getCheckfrontItemMappingByLocalEntity,
  createCheckfrontSyncLog,
} from '@/app/(staff)/contracts/_lib/checkfrontRepo'
import { updateGroupContract } from '@/app/(staff)/contracts/_lib/groupContractsRepo'

// ============================================================================
// Configuration
// ============================================================================

export interface CheckfrontConfig {
  baseUrl: string
  apiKey: string
  apiSecret: string
}

export function getCheckfrontConfig(): CheckfrontConfig {
  const baseUrl = process.env.CHECKFRONT_API_BASE_URL
  const apiKey = process.env.CHECKFRONT_API_KEY
  const apiSecret = process.env.CHECKFRONT_API_SECRET

  if (!baseUrl || !apiKey || !apiSecret) {
    throw new Error(
      'Checkfront not configured. Set CHECKFRONT_API_BASE_URL, CHECKFRONT_API_KEY, and CHECKFRONT_API_SECRET environment variables.'
    )
  }

  return { baseUrl, apiKey, apiSecret }
}

export function isCheckfrontConfigured(): boolean {
  return !!(
    process.env.CHECKFRONT_API_BASE_URL &&
    process.env.CHECKFRONT_API_KEY &&
    process.env.CHECKFRONT_API_SECRET
  )
}

export function buildCheckfrontHeaders(): Record<string, string> {
  const { apiKey, apiSecret } = getCheckfrontConfig()

  // Checkfront uses Basic Authentication with API key as username and secret as password
  const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')

  return {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${credentials}`,
    'Accept': 'application/json',
  }
}

// ============================================================================
// API Result Types
// ============================================================================

export interface CheckfrontApiResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  bookingId?: string
  bookingUrl?: string
}

// ============================================================================
// Payload Building Helpers
// ============================================================================

export interface CheckfrontPayloadItem {
  checkfrontItemId: string
  quantity: number
  startDate: string
  endDate: string
  // TODO: Add option mappings when needed (e.g., room occupancy as item option)
}

export interface CheckfrontPayload {
  customer: {
    name: string
    email?: string
    phone?: string
  }
  items: CheckfrontPayloadItem[]
  startDate: string
  endDate: string
  notes?: string
}

/**
 * Build a Checkfront payload from a GroupContract by looking up mappings.
 * Returns null if required mappings are missing.
 */
export async function buildCheckfrontPayloadFromContract(
  contract: GroupContract
): Promise<CheckfrontPayload | null> {
  const items: CheckfrontPayloadItem[] = []
  const errors: string[] = []

  // Map rooms to Checkfront items
  if (contract.rooms && contract.rooms.length > 0) {
    for (const room of contract.rooms) {
      if (room.numRooms <= 0) continue

      // Look up room category mapping
      const mapping = await getCheckfrontItemMappingByLocalEntity(
        'roomCategory',
        room.categoryId,
        contract.hotelId
      )

      if (!mapping) {
        errors.push(`No Checkfront mapping for room category ${room.categoryId}`)
        continue
      }

      items.push({
        checkfrontItemId: mapping.checkfrontItemId,
        quantity: room.numRooms,
        startDate: contract.startDate,
        endDate: contract.endDate,
      })
    }
  }

  // Map dive package if present
  if (contract.divePackageId) {
    const diveMapping = await getCheckfrontItemMappingByLocalEntity(
      'divePackage',
      contract.divePackageId,
      contract.hotelId
    )

    if (diveMapping) {
      items.push({
        checkfrontItemId: diveMapping.checkfrontItemId,
        quantity: contract.numDivers || contract.totalGuests || 1,
        startDate: contract.startDate,
        endDate: contract.endDate,
      })
    } else {
      errors.push(`No Checkfront mapping for dive package ${contract.divePackageId}`)
    }
  }

  // Map meal package if present
  if (contract.mealPackageId) {
    const mealMapping = await getCheckfrontItemMappingByLocalEntity(
      'mealPackage',
      contract.mealPackageId,
      contract.hotelId
    )

    if (mealMapping) {
      items.push({
        checkfrontItemId: mealMapping.checkfrontItemId,
        quantity: contract.totalGuests || 1,
        startDate: contract.startDate,
        endDate: contract.endDate,
      })
    } else {
      errors.push(`No Checkfront mapping for meal package ${contract.mealPackageId}`)
    }
  }

  // TODO: Map hotelAddons, diveAddons, mealAddons as additional items

  if (errors.length > 0) {
    console.warn('[Checkfront] Payload build warnings:', errors)
  }

  if (items.length === 0) {
    return null
  }

  return {
    customer: {
      name: contract.groupName,
      // TODO: Contract lacks email/phone fields - Checkfront customer creation may fail
      // or create incomplete customer records. See deliverables for assumptions.
    },
    items,
    startDate: contract.startDate,
    endDate: contract.endDate,
    notes: `Group Contract: ${contract.groupName} (${contract.totalGuests} guests)`,
  }
}

// ============================================================================
// Checkfront API Client
// ============================================================================

async function checkfrontApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<CheckfrontApiResult<T>> {
  try {
    const { baseUrl } = getCheckfrontConfig()
    const url = `${baseUrl}/api/3.0/${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        ...buildCheckfrontHeaders(),
        ...options.headers,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Checkfront API error: ${response.status}`,
      }
    }

    return {
      success: true,
      data: data as T,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[Checkfront] API request failed for ${endpoint}:`, errorMessage)
    return {
      success: false,
      error: errorMessage,
    }
  }
}

// ============================================================================
// Customer Operations
// ============================================================================

interface CheckfrontCustomer {
  customer_id: string
  name: string
  email?: string
}

/**
 * Create or find a customer in Checkfront.
 * TODO: Checkfront customer API details may vary - this is a defensive implementation.
 */
async function ensureCheckfrontCustomer(
  name: string,
  email?: string
): Promise<CheckfrontApiResult<CheckfrontCustomer>> {
  // TODO: Implement customer lookup by email first to avoid duplicates
  // If found, return existing; if not, create new

  // Defensive stub: return error indicating need for manual customer handling
  // or implement actual customer/create endpoint when API details confirmed
  console.log('[Checkfront] Customer ensure called for:', name, email)

  // TODO: Implement actual customer create/lookup
  // For now, return a placeholder indicating customer handling needed
  return {
    success: false,
    error: 'Customer auto-creation not yet implemented. Manual customer ID entry may be required.',
  }
}

// ============================================================================
// Session & Slip Operations
// ============================================================================

interface CheckfrontSession {
  session_id: string
}

interface CheckfrontSlip {
  slip_id: string
  item_id: string
}

/**
 * Create a booking session in Checkfront.
 * TODO: Verify exact endpoint and payload format with Checkfront API docs.
 */
async function createCheckfrontSession(): Promise<CheckfrontApiResult<CheckfrontSession>> {
  // TODO: Verify endpoint - may be /session/create or different
  const result = await checkfrontApiRequest<CheckfrontSession>('session/create', {
    method: 'POST',
    body: JSON.stringify({}),
  })

  if (!result.success) {
    return {
      success: false,
      error: `Failed to create session: ${result.error}`,
    }
  }

  return result
}

/**
 * Add an item as a slip to a Checkfront session.
 * TODO: Verify exact endpoint and required fields.
 */
async function addSlipToSession(
  sessionId: string,
  item: CheckfrontPayloadItem
): Promise<CheckfrontApiResult<CheckfrontSlip>> {
  // TODO: Verify endpoint format - may be /item/{item_id}/slip or /session/{id}/slip
  const result = await checkfrontApiRequest<CheckfrontSlip>(`item/${item.checkfrontItemId}/slip`, {
    method: 'POST',
    body: JSON.stringify({
      session_id: sessionId,
      quantity: item.quantity,
      start_date: item.startDate,
      end_date: item.endDate,
      // TODO: Add option mappings if needed
    }),
  })

  if (!result.success) {
    return {
      success: false,
      error: `Failed to add slip for item ${item.checkfrontItemId}: ${result.error}`,
    }
  }

  return result
}

// ============================================================================
// Booking Operations
// ============================================================================

interface CheckfrontBooking {
  booking_id: string
  code?: string
  url?: string
  status?: string
}

/**
 * Create a Checkfront booking from a prepared session.
 * TODO: Verify exact endpoint and required fields.
 */
async function createBookingFromSession(
  sessionId: string,
  customerId?: string
): Promise<CheckfrontApiResult<CheckfrontBooking>> {
  const result = await checkfrontApiRequest<CheckfrontBooking>('booking/create', {
    method: 'POST',
    body: JSON.stringify({
      session_id: sessionId,
      // TODO: Add customer_id when customer handling implemented
      // TODO: Add any other required fields (payment info, notes, etc.)
    }),
  })

  if (!result.success) {
    return {
      success: false,
      error: `Failed to create booking: ${result.error}`,
    }
  }

  // Build booking URL from base URL and booking code/ID
  const { baseUrl } = getCheckfrontConfig()
  const bookingData = result.data
  const bookingUrl = bookingData?.code
    ? `${baseUrl}/booking/${bookingData.code}`
    : undefined

  return {
    success: true,
    bookingId: bookingData?.booking_id,
    bookingUrl,
    data: bookingData,
  }
}

/**
 * Update an existing Checkfront booking.
 * TODO: Checkfront booking update has limitations - some fields may not be updatable.
 * TODO: For item changes, may need to delete and recreate slips.
 */
async function updateCheckfrontBooking(
  bookingId: string,
  updates: {
    notes?: string
    // TODO: Add other updatable fields as needed
  }
): Promise<CheckfrontApiResult<CheckfrontBooking>> {
  const result = await checkfrontApiRequest<CheckfrontBooking>(`booking/${bookingId}/update`, {
    method: 'POST',
    body: JSON.stringify(updates),
  })

  if (!result.success) {
    // Check for specific error: booking not found
    if (result.error?.toLowerCase().includes('not found')) {
      return {
        success: false,
        error: `Linked Checkfront booking not found: ${bookingId}`,
      }
    }
    return {
      success: false,
      error: `Failed to update booking: ${result.error}`,
    }
  }

  const { baseUrl } = getCheckfrontConfig()
  const bookingData = result.data
  const bookingUrl = bookingData?.code
    ? `${baseUrl}/booking/${bookingData.code}`
    : undefined

  return {
    success: true,
    bookingId: bookingData?.booking_id || bookingId,
    bookingUrl,
    data: bookingData,
  }
}

// ============================================================================
// Main Booking Sync Operations
// ============================================================================

/**
 * Create a new Checkfront booking from a GroupContract.
 * IMPORTANT: If contract.checkfrontSync.bookingId exists (manual link), skips creation.
 */
export async function createBookingFromContract(
  contract: GroupContract,
  _mappings?: CheckfrontItemMapping[] // Optional: pre-fetched mappings
): Promise<CheckfrontApiResult> {
  console.log('[Checkfront] createBookingFromContract called for contract:', contract.id)

  // Check if already has a booking ID (manual link)
  if (contract.checkfrontSync?.bookingId) {
    console.log('[Checkfront] Contract already has bookingId:', contract.checkfrontSync.bookingId)
    console.log('[Checkfront] Skipping creation - use update flow instead')
    return {
      success: false,
      error: 'Contract already has a linked Checkfront booking. Use update flow instead.',
    }
  }

  // Build payload from contract
  const payload = await buildCheckfrontPayloadFromContract(contract)
  if (!payload) {
    return {
      success: false,
      error: 'Could not build Checkfront payload: missing item mappings or no bookable items',
    }
  }

  // TODO: Implement full customer -> session -> slips -> booking flow
  // This is a conservative implementation with clear TODOs for remaining work

  try {
    // Step 1: Ensure customer exists
    const customerResult = await ensureCheckfrontCustomer(
      payload.customer.name,
      payload.customer.email
    )
    if (!customerResult.success) {
      // TODO: Decide if we should proceed without customer or fail
      // For now, log and continue (customer may be optional or created during booking)
      console.warn('[Checkfront] Customer handling:', customerResult.error)
    }

    // Step 2: Create session
    const sessionResult = await createCheckfrontSession()
    if (!sessionResult.success) {
      return {
        success: false,
        error: sessionResult.error,
      }
    }
    const sessionId = sessionResult.data!.session_id

    // Step 3: Add all items as slips
    const slipResults: string[] = []
    for (const item of payload.items) {
      const slipResult = await addSlipToSession(sessionId, item)
      if (slipResult.success) {
        slipResults.push(slipResult.data!.slip_id)
      } else {
        console.warn('[Checkfront] Failed to add slip:', slipResult.error)
        // Continue with other items - partial booking may still be useful
      }
    }

    if (slipResults.length === 0) {
      return {
        success: false,
        error: 'Failed to add any items to Checkfront session',
      }
    }

    // Step 4: Create booking from session
    const bookingResult = await createBookingFromSession(
      sessionId,
      customerResult.data?.customer_id
    )

    if (!bookingResult.success) {
      return {
        success: false,
        error: bookingResult.error,
      }
    }

    console.log('[Checkfront] Booking created:', bookingResult.bookingId)
    return {
      success: true,
      bookingId: bookingResult.bookingId,
      bookingUrl: bookingResult.bookingUrl,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[Checkfront] Create booking error:', errorMessage)
    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Update an existing Checkfront booking from a GroupContract.
 */
export async function updateBookingFromContract(
  contract: GroupContract,
  _mappings?: CheckfrontItemMapping[] // Optional: pre-fetched mappings
): Promise<CheckfrontApiResult> {
  const bookingId = contract.checkfrontSync?.bookingId

  console.log('[Checkfront] updateBookingFromContract called for contract:', contract.id)
  console.log('[Checkfront] Existing bookingId:', bookingId || 'none')

  if (!bookingId) {
    return {
      success: false,
      error: 'Cannot update: contract has no linked Checkfront bookingId',
    }
  }

  // TODO: Implement full update flow
  // Checkfront limitations:
  // - Some fields may not be updatable after booking creation
  // - Item changes may require delete/recreate of slips
  // - Customer changes may be limited

  try {
    // Conservative first-pass: update notes and track that we attempted update
    const updateResult = await updateCheckfrontBooking(bookingId, {
      notes: `Updated from Group Contract: ${contract.groupName} (${contract.totalGuests} guests)`,
      // TODO: Add other updatable fields as API capabilities are confirmed
    })

    if (!updateResult.success) {
      return {
        success: false,
        error: updateResult.error,
      }
    }

    console.log('[Checkfront] Booking updated:', bookingId)
    return {
      success: true,
      bookingId,
      bookingUrl: updateResult.bookingUrl,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[Checkfront] Update booking error:', errorMessage)
    return {
      success: false,
      error: errorMessage,
    }
  }
}

// ============================================================================
// Sync Orchestration with Firestore Writeback
// ============================================================================

/**
 * Main entry point: Sync a contract to Checkfront and update Firestore.
 * This should be called after successful contract save.
 *
 * @param contractId - The saved contract ID
 * @param contract - The full contract data
 * @returns The updated CheckfrontSyncInfo (should be saved to Firestore by caller)
 */
export async function syncContractToCheckfront(
  contractId: string,
  contract: GroupContract
): Promise<CheckfrontSyncInfo> {
  const now = new Date()

  // Check if Checkfront is configured
  if (!isCheckfrontConfigured()) {
    const syncInfo: CheckfrontSyncInfo = {
      status: 'not_linked',
      lastError: 'Checkfront not configured',
      lastSyncedAt: now,
      lastSyncDirection: 'app_to_checkfront',
    }

    // Log the skipped sync attempt
    await createCheckfrontSyncLog(contractId, {
      action: contract.checkfrontSync?.bookingId ? 'update_booking' : 'create_booking',
      success: false,
      error: 'Checkfront not configured',
    })

    return syncInfo
  }

  const existingBookingId = contract.checkfrontSync?.bookingId
  const isManuallyLinked = contract.checkfrontSync?.manuallyLinked || false

  let result: CheckfrontApiResult
  let action: 'create_booking' | 'update_booking'

  try {
    if (existingBookingId) {
      // Update existing booking
      action = 'update_booking'
      console.log('[Checkfront] Updating linked booking:', existingBookingId)
      result = await updateBookingFromContract(contract)
    } else {
      // Create new booking
      action = 'create_booking'
      console.log('[Checkfront] Creating new booking for contract:', contractId)
      result = await createBookingFromContract(contract)
    }

    // Log the sync attempt
    await createCheckfrontSyncLog(contractId, {
      action,
      success: result.success,
      requestSummary: {
        contractId,
        groupName: contract.groupName,
        hotelId: contract.hotelId,
        startDate: contract.startDate,
        endDate: contract.endDate,
        totalGuests: contract.totalGuests,
      },
      responseSummary: result.success
        ? {
            bookingId: result.bookingId,
            bookingUrl: result.bookingUrl,
          }
        : undefined,
      error: result.error || null,
    })

    // Build sync info based on result
    if (result.success && result.bookingId) {
      const syncInfo: CheckfrontSyncInfo = {
        bookingId: result.bookingId,
        bookingUrl: result.bookingUrl,
        status: 'linked',
        lastSyncedAt: now,
        lastSyncDirection: 'app_to_checkfront',
        lastError: null,
        // Preserve manuallyLinked flag - it stays true for history even after app sync
        manuallyLinked: isManuallyLinked,
      }

      // Update Firestore with new sync info
      await updateGroupContract(contractId, { checkfrontSync: syncInfo })

      return syncInfo
    } else {
      // Sync failed but preserve existing bookingId and manuallyLinked
      const syncInfo: CheckfrontSyncInfo = {
        bookingId: existingBookingId, // Preserve existing
        status: existingBookingId ? 'sync_error' : 'not_linked',
        lastSyncedAt: now,
        lastSyncDirection: 'app_to_checkfront',
        lastError: result.error || 'Unknown error during sync',
        manuallyLinked: isManuallyLinked, // Preserve
      }

      // Update Firestore with error state
      await updateGroupContract(contractId, { checkfrontSync: syncInfo })

      return syncInfo
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[Checkfront] Sync error:', errorMessage)

    // Log the error
    await createCheckfrontSyncLog(contractId, {
      action: existingBookingId ? 'update_booking' : 'create_booking',
      success: false,
      error: errorMessage,
    })

    // Return error state but preserve existing data
    const syncInfo: CheckfrontSyncInfo = {
      bookingId: existingBookingId, // Preserve existing
      status: existingBookingId ? 'sync_error' : 'not_linked',
      lastSyncedAt: now,
      lastSyncDirection: 'app_to_checkfront',
      lastError: errorMessage,
      manuallyLinked: isManuallyLinked, // Preserve
    }

    // Update Firestore with error state
    try {
      await updateGroupContract(contractId, { checkfrontSync: syncInfo })
    } catch (updateError) {
      console.error('[Checkfront] Failed to update contract with sync error:', updateError)
    }

    return syncInfo
  }
}
