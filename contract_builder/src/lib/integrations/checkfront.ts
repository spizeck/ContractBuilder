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
  getGroupContractByIdServer,
  updateGroupContractServer,
  getRoomCategoryByIdServer,
  getDivePackageByIdServer,
  getMealPackageByIdServer,
  createCheckfrontSyncLogServer,
} from '@/app/(staff)/contracts/_lib/checkfrontServerRepos'

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
 * 
 * Uses the new data model:
 * - Room categories: roomCategories.checkfrontItemIds[occupancy]
 * - Dive packages: divePackages.checkfrontItemId
 * - Meal packages: mealPackages.checkfrontItemId
 */
export async function buildCheckfrontPayloadFromContract(
  contract: GroupContract
): Promise<CheckfrontPayload | null> {
  const items: CheckfrontPayloadItem[] = []
  const errors: string[] = []

  console.log(`[Checkfront] Building payload for contract: ${contract.groupName} (${contract.id || 'new'})`)
  console.log(`[Checkfront] Hotel ID: ${contract.hotelId}, Rooms: ${contract.rooms?.length || 0}`)

  // Map rooms to Checkfront items using roomCategories.checkfrontItemIds
  if (contract.rooms && contract.rooms.length > 0) {
    console.log(`[Checkfront] Resolving ${contract.rooms.length} room lines...`)
    
    for (const room of contract.rooms) {
      if (room.numRooms <= 0) continue

      // Load room category directly from Firestore
      const category = await getRoomCategoryByIdServer(room.categoryId)

      if (!category) {
        errors.push(`Room category not found: ${room.categoryId}`)
        console.error(`[Checkfront] Room category not found: ${room.categoryId}`)
        continue
      }

      // Resolve Checkfront item ID from category.checkfrontItemIds[occupancy]
      const checkfrontItemId = category.checkfrontItemIds?.[room.occupancyType as keyof typeof category.checkfrontItemIds]

      if (!checkfrontItemId) {
        errors.push(
          `Missing Checkfront room mapping for category "${category.name}" occupancy "${room.occupancyType}"`
        )
        console.error(
          `[Checkfront] Missing mapping: ${category.name} / ${room.occupancyType} => ` +
          `category.checkfrontItemIds = ${JSON.stringify(category.checkfrontItemIds)}`
        )
        continue
      }

      console.log(
        `[Checkfront] Room resolved: ${category.name} / ${room.occupancyType} => Item ID: ${checkfrontItemId}`
      )

      items.push({
        checkfrontItemId,
        quantity: room.numRooms,
        startDate: contract.startDate,
        endDate: contract.endDate,
      })
    }
  }

  // Map dive package if present using divePackages.checkfrontItemId
  if (contract.divePackageId) {
    console.log(`[Checkfront] Resolving dive package: ${contract.divePackageId}`)
    
    const divePackage = await getDivePackageByIdServer(contract.divePackageId)

    if (!divePackage) {
      errors.push(`Dive package not found: ${contract.divePackageId}`)
      console.error(`[Checkfront] Dive package not found: ${contract.divePackageId}`)
    } else {
      const checkfrontItemId = divePackage.checkfrontItemId

      if (!checkfrontItemId) {
        errors.push(`Missing Checkfront mapping for dive package "${divePackage.name}"`)
        console.error(`[Checkfront] Dive package missing checkfrontItemId: ${divePackage.name}`)
      } else {
        console.log(`[Checkfront] Dive package resolved: ${divePackage.name} => Item ID: ${checkfrontItemId}`)
        
        items.push({
          checkfrontItemId,
          quantity: contract.numDivers || contract.totalGuests || 1,
          startDate: contract.startDate,
          endDate: contract.endDate,
        })
      }
    }
  }

  // Map meal package if present using mealPackages.checkfrontItemId
  if (contract.mealPackageId) {
    console.log(`[Checkfront] Resolving meal package: ${contract.mealPackageId}`)
    
    const mealPackage = await getMealPackageByIdServer(contract.mealPackageId)

    if (!mealPackage) {
      errors.push(`Meal package not found: ${contract.mealPackageId}`)
      console.error(`[Checkfront] Meal package not found: ${contract.mealPackageId}`)
    } else {
      const checkfrontItemId = mealPackage.checkfrontItemId

      if (!checkfrontItemId) {
        errors.push(`Missing Checkfront mapping for meal package "${mealPackage.name}"`)
        console.error(`[Checkfront] Meal package missing checkfrontItemId: ${mealPackage.name}`)
      } else {
        console.log(`[Checkfront] Meal package resolved: ${mealPackage.name} => Item ID: ${checkfrontItemId}`)
        
        items.push({
          checkfrontItemId,
          quantity: contract.totalGuests || 1,
          startDate: contract.startDate,
          endDate: contract.endDate,
        })
      }
    }
  }

  // TODO: Map hotelAddons, diveAddons, mealAddons as additional items

  if (errors.length > 0) {
    console.warn('[Checkfront] Payload build warnings:', errors)
  }

  console.log(`[Checkfront] Payload complete: ${items.length} items, ${errors.length} errors`)

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
    await createCheckfrontSyncLogServer(contractId, {
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
    await createCheckfrontSyncLogServer(contractId, {
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
      await updateGroupContractServer(contractId, { checkfrontSync: syncInfo })

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
      await updateGroupContractServer(contractId, { checkfrontSync: syncInfo })

      return syncInfo
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[Checkfront] Sync error:', errorMessage)

    // Log the error
    await createCheckfrontSyncLogServer(contractId, {
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
      await updateGroupContractServer(contractId, { checkfrontSync: syncInfo })
    } catch (updateError) {
      console.error('[Checkfront] Failed to update contract with sync error:', updateError)
    }

    return syncInfo
  }
}

// ============================================================================
// Test Function - Checkfront API Connection
// ============================================================================

/**
 * Test function to verify Checkfront API connectivity and fetch items
 * Call this from a server context (Server Action or API route) to test the connection
 */
export async function testCheckfrontConnection(): Promise<{
  success: boolean
  message: string
  items?: any[]
  error?: string
}> {
  const config = getCheckfrontConfig()

  // Check if credentials are configured
  if (!config.apiKey || !config.apiSecret) {
    return {
      success: false,
      message: 'Checkfront API credentials not configured',
      error: 'Missing CHECKFRONT_API_KEY or CHECKFRONT_API_SECRET environment variables',
    }
  }

  console.log('[Checkfront Test] API Base URL:', config.baseUrl)
  console.log('[Checkfront Test] API Key present:', !!config.apiKey)

  // Build Basic Auth header
  const authHeader = `Basic ${Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString('base64')}`

  try {
    // Try to fetch items from Checkfront
    // Common endpoints to try: /item, /inventory, /booking
    const endpoints = ['item', 'inventory/index', 'booking/index']

    for (const endpoint of endpoints) {
      try {
        const url = `${config.baseUrl}/${endpoint}`
        console.log(`[Checkfront Test] Trying endpoint: ${url}`)

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        })

        console.log(`[Checkfront Test] Response status: ${response.status}`)

        if (response.ok) {
          const data = await response.json()
          console.log(`[Checkfront Test] Success! Response:`, JSON.stringify(data).substring(0, 500))

          return {
            success: true,
            message: `Successfully connected to Checkfront API (endpoint: ${endpoint})`,
            items: data.items || data.inventory || data.bookings || data,
          }
        } else {
          const errorText = await response.text()
          console.log(`[Checkfront Test] Error from ${endpoint}:`, errorText.substring(0, 200))
        }
      } catch (endpointError) {
        console.log(`[Checkfront Test] Failed to fetch ${endpoint}:`, endpointError)
      }
    }

    return {
      success: false,
      message: 'Could not connect to any Checkfront API endpoint',
      error: 'All tested endpoints returned errors. Check API credentials and base URL.',
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[Checkfront Test] Connection error:', errorMessage)

    return {
      success: false,
      message: 'Failed to connect to Checkfront API',
      error: errorMessage,
    }
  }
}
