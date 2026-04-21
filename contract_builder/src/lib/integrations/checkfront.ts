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

/**
 * Build a Checkfront API URL, normalizing /api/3.0 so it appears exactly once.
 * Handles baseUrl with or without trailing slash, and with or without /api/3.0.
 * Handles endpoint path with or without leading slash.
 */
export function buildCheckfrontUrl(endpoint: string): string {
  const { baseUrl } = getCheckfrontConfig()
  // Strip trailing slash from base
  const base = baseUrl.replace(/\/+$/, '')
  // Strip /api/3.0 suffix if already present in base, so we always add it once
  const normalizedBase = base.replace(/\/api\/3\.0$/, '')
  // Strip leading slash from endpoint
  const normalizedEndpoint = endpoint.replace(/^\/+/, '')
  return `${normalizedBase}/api/3.0/${normalizedEndpoint}`
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
  bookingCode?: string  // public booking reference e.g. FTVG-200426
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
        // Dive package dates: start = arrival + 1 day, end = diveStart + (durationDays - 1)
        // This matches Checkfront's duration limits (e.g. 5-Day package = exactly 5 days)
        let durationDays = divePackage.durationDays
        if (!durationDays) {
          // Fallback: parse duration from package name (e.g. "5-Day Dive Package" -> 5)
          const match = divePackage.name.match(/(\d+)[- ]?day/i)
          if (match) {
            durationDays = parseInt(match[1], 10)
            console.warn(
              `[Checkfront] Dive package "${divePackage.name}" has no durationDays field. ` +
              `Parsed ${durationDays} from name. Set durationDays in the dive package editor to remove this warning.`
            )
          } else {
            console.warn(
              `[Checkfront] Dive package "${divePackage.name}" has no durationDays and name could not be parsed. ` +
              `Falling back to full contract date range. This may cause INVALID_DURATION errors.`
            )
          }
        }

        let diveStartDate: string
        let diveEndDate: string
        if (durationDays) {
          // diveStart = contract arrival + 1 day
          const arrivalDate = new Date(contract.startDate)
          arrivalDate.setDate(arrivalDate.getDate() + 1)
          diveStartDate = arrivalDate.toISOString().slice(0, 10)
          // diveEnd = diveStart + (durationDays - 1) days
          const endDate = new Date(arrivalDate)
          endDate.setDate(endDate.getDate() + durationDays - 1)
          diveEndDate = endDate.toISOString().slice(0, 10)
        } else {
          diveStartDate = contract.startDate
          diveEndDate = contract.endDate
        }

        console.log(
          `[Checkfront] Dive package resolved: "${divePackage.name}" => Item ID: ${checkfrontItemId} ` +
          `durationDays=${durationDays ?? 'unknown'} diveStart=${diveStartDate} diveEnd=${diveEndDate}`
        )

        items.push({
          checkfrontItemId,
          quantity: contract.numDivers || contract.totalGuests || 1,
          startDate: diveStartDate,
          endDate: diveEndDate,
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
  const url = buildCheckfrontUrl(endpoint)

  console.log(`[Checkfront] ${options.method || 'GET'} ${url}`)

  let response: Response
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        ...buildCheckfrontHeaders(),
        ...options.headers,
      },
    })
  } catch (networkError) {
    const msg = networkError instanceof Error ? networkError.message : String(networkError)
    console.error(`[Checkfront] Network error for ${endpoint}:`, msg)
    return { success: false, error: `Network error: ${msg}` }
  }

  // Read response body as text first so we never lose it
  let rawBody: string
  try {
    rawBody = await response.text()
  } catch (readError) {
    console.error(`[Checkfront] Failed to read response body for ${endpoint}`)
    return { success: false, error: `Checkfront API ${response.status}: (unreadable response)` }
  }

  console.log(`[Checkfront] ${endpoint} => HTTP ${response.status}: ${rawBody.substring(0, 500)}`)

  // Parse JSON
  let data: any
  try {
    data = JSON.parse(rawBody)
  } catch {
    // Non-JSON response
    return {
      success: false,
      error: `Checkfront API ${response.status}: ${rawBody.substring(0, 200)}`,
    }
  }

  if (!response.ok) {
    // Checkfront may use different error keys
    const errorMsg =
      data?.error ||
      data?.message ||
      data?.errors?.[0] ||
      (typeof data === 'string' ? data : null) ||
      `Checkfront API error: ${response.status}`
    return { success: false, error: errorMsg }
  }

  return { success: true, data: data as T }
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
// Rated Item + Session + Booking Operations
// ============================================================================

/**
 * Format a date string (YYYY-MM-DD or ISO) to Checkfront's required YYYYMMDD format.
 */
function toCheckfrontDate(date: string): string {
  return date.replace(/-/g, '').substring(0, 8)
}

/**
 * Step 1: GET /api/3.0/item/{item_id}?start_date=YYYYMMDD&end_date=YYYYMMDD&param[qty]=N
 * Returns the SLIP token needed to create a booking session.
 * The slip lives at item.rate.slip in the response.
 */
async function getRatedItemSlip(
  item: CheckfrontPayloadItem
): Promise<CheckfrontApiResult<{ slip: string }>> {
  const startDate = toCheckfrontDate(item.startDate)
  const endDate = toCheckfrontDate(item.endDate)
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
    'param[qty]': String(item.quantity),
  })
  const endpoint = `item/${item.checkfrontItemId}?${params.toString()}`
  const url = buildCheckfrontUrl(endpoint)
  console.log(`[Checkfront][Step: rated_item] GET ${url}`)

  const result = await checkfrontApiRequest<any>(`item/${item.checkfrontItemId}?${params.toString()}`)

  if (!result.success) {
    console.error(`[Checkfront][Step: rated_item] FAILED item=${item.checkfrontItemId}: ${result.error}`)
    return { success: false, error: `[rated_item item=${item.checkfrontItemId}] ${result.error}` }
  }

  console.log(`[Checkfront][Step: rated_item] Raw response item=${item.checkfrontItemId}:`, JSON.stringify(result.data).substring(0, 500))

  const slip: string | undefined = result.data?.item?.rate?.slip
  if (!slip) {
    const status = result.data?.item?.rate?.status
    console.error(`[Checkfront][Step: rated_item] No slip returned for item=${item.checkfrontItemId} rate.status=${status}`)
    return {
      success: false,
      error: `[rated_item item=${item.checkfrontItemId}] No slip in response (rate.status=${status}). Check availability and date range.`,
    }
  }

  console.log(`[Checkfront][Step: rated_item] OK item=${item.checkfrontItemId} slip=${slip}`)
  return { success: true, data: { slip } }
}

/**
 * Step 2: POST /api/3.0/booking/session with slip[]=<slip1>&slip[]=<slip2>
 * Checkfront requires form-encoded body (not JSON) for slip arrays.
 * Returns session_id.
 */
async function createBookingSession(
  slips: string[]
): Promise<CheckfrontApiResult<{ session_id: string }>> {
  // Build form-encoded body: slip[]=value&slip[]=value
  const body = slips.map(s => `slip[]=${encodeURIComponent(s)}`).join('&')
  console.log(`[Checkfront][Step: booking_session] POST booking/session slips=${slips.length} body=${body.substring(0, 200)}`)

  const { apiKey, apiSecret } = getCheckfrontConfig()
  const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')
  const url = buildCheckfrontUrl('booking/session')

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json',
      },
      body,
    })
  } catch (networkError) {
    const msg = networkError instanceof Error ? networkError.message : String(networkError)
    console.error(`[Checkfront][Step: booking_session] Network error: ${msg}`)
    return { success: false, error: `[booking_session] Network error: ${msg}` }
  }

  const rawBody = await response.text()
  console.log(`[Checkfront][Step: booking_session] HTTP ${response.status}: ${rawBody.substring(0, 500)}`)

  let data: any
  try { data = JSON.parse(rawBody) } catch {
    return { success: false, error: `[booking_session] HTTP ${response.status}: ${rawBody.substring(0, 200)}` }
  }

  if (!response.ok) {
    const errMsg = data?.error || data?.message || data?.errors?.[0] || `HTTP ${response.status}`
    return { success: false, error: `[booking_session] ${errMsg}` }
  }

  const sessionId: string | undefined =
    data?.booking?.session?.id ||   // actual Checkfront shape: booking.session.id
    data?.session?.session_id ||
    data?.session_id ||
    data?.request?.session_id

  if (!sessionId) {
    console.error(`[Checkfront][Step: booking_session] No session_id in response:`, JSON.stringify(data).substring(0, 300))
    return {
      success: false,
      error: `[booking_session] No session_id in response: ${JSON.stringify(data).substring(0, 300)}`,
    }
  }

  console.log(`[Checkfront][Step: booking_session] OK session_id=${sessionId} (from booking.session.id)`)
  return { success: true, data: { session_id: sessionId } }
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
 * Step 3: POST /api/3.0/booking/create with session_id and customer form fields.
 * form[customer_name] is the minimum required field.
 */
async function createBookingFromSession(
  sessionId: string,
  customerName: string
): Promise<CheckfrontApiResult<CheckfrontBooking>> {
  console.log(`[Checkfront][Step: create_booking] session_id=${sessionId} customer="${customerName}"`)

  // booking/create requires form-encoded body with form[] fields
  const body = new URLSearchParams({
    session_id: sessionId,
    'form[customer_name]': customerName,
  }).toString()

  const { apiKey, apiSecret, baseUrl } = getCheckfrontConfig()
  const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')
  const url = buildCheckfrontUrl('booking/create')
  console.log(`[Checkfront][Step: create_booking] POST ${url}`)

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json',
      },
      body,
    })
  } catch (networkError) {
    const msg = networkError instanceof Error ? networkError.message : String(networkError)
    console.error(`[Checkfront][Step: create_booking] Network error: ${msg}`)
    return { success: false, error: `[create_booking] Network error: ${msg}` }
  }

  const rawBody = await response.text()
  console.log(`[Checkfront][Step: create_booking] HTTP ${response.status}: ${rawBody.substring(0, 500)}`)

  let data: any
  try { data = JSON.parse(rawBody) } catch {
    return { success: false, error: `[create_booking] HTTP ${response.status}: ${rawBody.substring(0, 200)}` }
  }

  if (!response.ok) {
    const errMsg = data?.error || data?.message || data?.errors?.[0] || `HTTP ${response.status}`
    console.error(`[Checkfront][Step: create_booking] FAILED: ${errMsg}`)
    return { success: false, error: `[create_booking] ${errMsg}` }
  }

  const frontendBase = baseUrl.replace(/\/api\/3\.0\/?$/, '').replace(/\/+$/, '')
  const bookingId: string | undefined =
    data?.booking?.booking_id ||
    data?.booking_id ||
    data?.request?.booking_id
  const bookingCode: string | undefined =
    data?.booking?.code ||
    data?.code ||
    data?.request?.code
  const bookingUrl = bookingCode ? `${frontendBase}/booking/${bookingCode}` : undefined

  if (!bookingId) {
    console.error('[Checkfront][Step: create_booking] No booking_id in response:', JSON.stringify(data).substring(0, 300))
    return {
      success: false,
      error: `[create_booking] No booking_id in response: ${JSON.stringify(data).substring(0, 300)}`,
    }
  }

  console.log(`[Checkfront][Step: create_booking] OK booking_id=${bookingId} code=${bookingCode || 'none'}`)
  return { success: true, bookingId, bookingCode, bookingUrl, data }
}

/**
 * Update an existing Checkfront booking (notes only for now).
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

  // Strip /api/3.0 from baseUrl - booking URLs are frontend links, not API paths
  const { baseUrl } = getCheckfrontConfig()
  const frontendBase = baseUrl.replace(/\/api\/3\.0\/?$/, '').replace(/\/+$/, '')
  const bookingData = result.data
  const bookingUrl = bookingData?.code
    ? `${frontendBase}/booking/${bookingData.code}`
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
): Promise<CheckfrontApiResult & { lastStep?: string }> {
  console.log(`[Checkfront][createBookingFromContract] START contract=${contract.id} group="${contract.groupName}"`)

  // Check if already has a booking ID (manual link)
  if (contract.checkfrontSync?.bookingId) {
    console.log('[Checkfront][createBookingFromContract] Already has bookingId:', contract.checkfrontSync.bookingId, '- use update flow')
    return {
      success: false,
      error: 'Contract already has a linked Checkfront booking. Use update flow instead.',
      lastStep: 'pre_check',
    }
  }

  // Build payload from contract
  console.log('[Checkfront][Step: build_payload] Building payload...')
  const payload = await buildCheckfrontPayloadFromContract(contract)
  if (!payload) {
    console.error('[Checkfront][Step: build_payload] FAILED: returned null')
    return {
      success: false,
      error: '[build_payload] Could not build Checkfront payload: missing item mappings or no bookable items',
      lastStep: 'build_payload',
    }
  }
  console.log(`[Checkfront][Step: build_payload] OK - ${payload.items.length} items, customer="${payload.customer.name}"`)

  try {
    // Step 1: Rated item calls - GET /item/{id}?start_date=...&end_date=...&param[qty]=N
    // Each item call returns a SLIP token encoding availability + pricing for that date range.
    const slips: string[] = []
    const slipErrors: string[] = []
    for (const item of payload.items) {
      const ratedResult = await getRatedItemSlip(item)
      if (ratedResult.success && ratedResult.data?.slip) {
        slips.push(ratedResult.data.slip)
      } else {
        slipErrors.push(ratedResult.error || `item=${item.checkfrontItemId} no slip returned`)
      }
    }

    if (slips.length === 0) {
      const combinedErrors = slipErrors.join('; ')
      console.error(`[Checkfront][Step: rated_items] FAILED - no slips obtained. Errors: ${combinedErrors}`)
      return {
        success: false,
        error: `[rated_items] No slips returned for any item. Errors: ${combinedErrors}`,
        lastStep: 'rated_items',
      }
    }
    console.log(`[Checkfront][Step: rated_items] OK - ${slips.length}/${payload.items.length} slips obtained`)
    if (slipErrors.length > 0) {
      console.warn(`[Checkfront][Step: rated_items] ${slipErrors.length} item(s) failed: ${slipErrors.join('; ')}`)
    }

    // Step 2: POST /booking/session with slip[]=... (form-encoded)
    const sessionResult = await createBookingSession(slips)
    if (!sessionResult.success) {
      return {
        success: false,
        error: sessionResult.error,
        lastStep: 'booking_session',
      }
    }
    const sessionId = sessionResult.data!.session_id

    // Step 3: POST /booking/create with session_id + form[customer_name]
    const bookingResult = await createBookingFromSession(
      sessionId,
      payload.customer.name
    )

    if (!bookingResult.success) {
      return {
        success: false,
        error: bookingResult.error,
        lastStep: 'create_booking',
      }
    }

    console.log(`[Checkfront][createBookingFromContract] SUCCESS booking_id=${bookingResult.bookingId}`)
    return {
      success: true,
      bookingId: bookingResult.bookingId,
      bookingUrl: bookingResult.bookingUrl,
      lastStep: 'create_booking',
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[Checkfront][createBookingFromContract] EXCEPTION:', errorMessage)
    return {
      success: false,
      error: `[exception] ${errorMessage}`,
      lastStep: 'exception',
    }
  }
}

/**
 * Update an existing Checkfront booking from a GroupContract.
 *
 * The Checkfront API does not expose an "update items" endpoint — the only way
 * to push revised items, dates, and quantities is to build new slips from the
 * current contract data and create a new booking.
 *
 * Flow:
 *  1. Build payload from the current contract (app is source of truth)
 *  2. Get rated-item slips for each item (validates availability + encodes pricing)
 *  3. Create a new booking session with the new slips
 *  4. Create a new booking from that session
 *  5. Mark the old booking with a note that it has been superseded
 *
 * The old bookingId is stored alongside the new one in the sync result so the
 * Firestore writeback can record the full history.
 */
export async function updateBookingFromContract(
  contract: GroupContract,
  _mappings?: CheckfrontItemMapping[] // Optional: pre-fetched mappings
): Promise<CheckfrontApiResult & { lastStep?: string }> {
  const oldBookingId = contract.checkfrontSync?.bookingId

  console.log(`[Checkfront][updateBookingFromContract] START contract=${contract.id} group="${contract.groupName}"`)
  console.log(`[Checkfront][updateBookingFromContract] Old bookingId=${oldBookingId || 'none'}`)

  if (!oldBookingId) {
    return {
      success: false,
      error: 'Cannot update: contract has no linked Checkfront bookingId',
      lastStep: 'pre_check',
    }
  }

  // Build payload from current contract data — app is the source of truth
  console.log('[Checkfront][Step: build_payload] Building updated payload from contract...')
  const payload = await buildCheckfrontPayloadFromContract(contract)
  if (!payload) {
    console.error('[Checkfront][Step: build_payload] FAILED: returned null')
    return {
      success: false,
      error: '[build_payload] Could not build Checkfront payload: missing item mappings or no bookable items',
      lastStep: 'build_payload',
    }
  }
  console.log(`[Checkfront][Step: build_payload] OK - ${payload.items.length} items, customer="${payload.customer.name}"`)

  try {
    // Step 1: Get rated-item slips for each item (encodes current dates + quantities from app)
    const slips: string[] = []
    const slipErrors: string[] = []
    for (const item of payload.items) {
      console.log(`[Checkfront][Step: rated_items] item=${item.checkfrontItemId} qty=${item.quantity} start=${item.startDate} end=${item.endDate}`)
      const ratedResult = await getRatedItemSlip(item)
      if (ratedResult.success && ratedResult.data?.slip) {
        slips.push(ratedResult.data.slip)
      } else {
        slipErrors.push(ratedResult.error || `item=${item.checkfrontItemId} no slip returned`)
      }
    }

    if (slips.length === 0) {
      const combinedErrors = slipErrors.join('; ')
      console.error(`[Checkfront][Step: rated_items] FAILED - no slips. Errors: ${combinedErrors}`)
      return {
        success: false,
        error: `[rated_items] No slips returned. Errors: ${combinedErrors}`,
        lastStep: 'rated_items',
      }
    }
    console.log(`[Checkfront][Step: rated_items] OK - ${slips.length}/${payload.items.length} slips obtained`)
    if (slipErrors.length > 0) {
      console.warn(`[Checkfront][Step: rated_items] ${slipErrors.length} item(s) failed: ${slipErrors.join('; ')}`)
    }

    // Step 2: Create a new booking session with the updated slips
    const sessionResult = await createBookingSession(slips)
    if (!sessionResult.success) {
      return {
        success: false,
        error: sessionResult.error,
        lastStep: 'booking_session',
      }
    }
    const sessionId = sessionResult.data!.session_id

    // Step 3: Create a new booking from the session
    const bookingResult = await createBookingFromSession(sessionId, payload.customer.name)
    if (!bookingResult.success) {
      return {
        success: false,
        error: bookingResult.error,
        lastStep: 'create_booking',
      }
    }

    const newBookingId = bookingResult.bookingId!
    const newBookingCode = bookingResult.bookingCode
    const newBookingUrl = bookingResult.bookingUrl
    console.log(`[Checkfront][updateBookingFromContract] New booking created: id=${newBookingId} code=${newBookingCode || 'none'}`)

    // Step 4: Mark the old booking with a note that it has been superseded (best-effort, non-fatal)
    try {
      await updateCheckfrontBooking(oldBookingId, {
        notes: `SUPERSEDED: This booking was replaced by booking #${newBookingId}${newBookingCode ? ` (${newBookingCode})` : ''} when the contract was updated on ${new Date().toISOString().slice(0, 10)}.`,
      })
      console.log(`[Checkfront][updateBookingFromContract] Old booking ${oldBookingId} marked as superseded`)
    } catch (noteError) {
      console.warn(`[Checkfront][updateBookingFromContract] Could not add superseded note to old booking ${oldBookingId}:`, noteError)
    }

    return {
      success: true,
      bookingId: newBookingId,
      bookingCode: newBookingCode,
      bookingUrl: newBookingUrl,
      lastStep: 'create_booking',
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[Checkfront][updateBookingFromContract] EXCEPTION:', errorMessage)
    return {
      success: false,
      error: `[exception] ${errorMessage}`,
      lastStep: 'exception',
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
  console.log(`[Checkfront][syncContractToCheckfront] START contractId=${contractId} group="${contract.groupName}"`)

  // Check if Checkfront is configured
  if (!isCheckfrontConfigured()) {
    console.warn('[Checkfront][syncContractToCheckfront] Not configured - skipping sync')
    const syncInfo: CheckfrontSyncInfo = {
      status: 'not_linked',
      lastError: 'Checkfront not configured',
      lastSyncedAt: now,
      lastSyncDirection: 'app_to_checkfront',
    }

    await createCheckfrontSyncLogServer(contractId, {
      action: contract.checkfrontSync?.bookingId ? 'update_booking' : 'create_booking',
      success: false,
      error: 'Checkfront not configured',
    })

    return syncInfo
  }

  const existingBookingId = contract.checkfrontSync?.bookingId
  const isManuallyLinked = contract.checkfrontSync?.manuallyLinked || false

  let result: CheckfrontApiResult & { lastStep?: string }
  let action: 'create_booking' | 'update_booking'

  try {
    if (existingBookingId) {
      action = 'update_booking'
      console.log(`[Checkfront][syncContractToCheckfront] Action=update_booking bookingId=${existingBookingId}`)
      result = await updateBookingFromContract(contract)
    } else {
      action = 'create_booking'
      console.log(`[Checkfront][syncContractToCheckfront] Action=create_booking contractId=${contractId}`)
      result = await createBookingFromContract(contract)
    }

    console.log(`[Checkfront][syncContractToCheckfront] Result: success=${result.success} lastStep=${(result as any).lastStep} bookingId=${result.bookingId} error=${result.error}`)

    // Log the sync attempt with step detail
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
            // Only include bookingUrl if defined - Firestore rejects undefined values
            ...(result.bookingUrl ? { bookingUrl: result.bookingUrl } : {}),
          }
        : { lastStep: (result as any).lastStep },
      error: result.error || null,
    })

    // Build sync info based on result
    // Note: result.success can be true but result.bookingId undefined if API returned no booking_id
    if (result.success && result.bookingId) {
      const syncInfo: CheckfrontSyncInfo = {
        bookingId: result.bookingId,
        // Only include optional fields if defined - Firestore rejects undefined values
        ...(result.bookingCode ? { bookingCode: result.bookingCode } : {}),
        ...(result.bookingUrl ? { bookingUrl: result.bookingUrl } : {}),
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
        // Only include bookingId if it has a real value - Firestore rejects undefined
        ...(existingBookingId ? { bookingId: existingBookingId } : {}),
        status: existingBookingId ? 'sync_error' : 'not_linked',
        lastSyncedAt: now,
        lastSyncDirection: 'app_to_checkfront',
        lastError: result.error
          || (result.success ? 'Sync succeeded but no bookingId returned from Checkfront' : 'Sync failed with no error detail')
          ,
        manuallyLinked: isManuallyLinked,
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
      // Only include bookingId if it has a real value - Firestore rejects undefined
      ...(existingBookingId ? { bookingId: existingBookingId } : {}),
      status: existingBookingId ? 'sync_error' : 'not_linked',
      lastSyncedAt: now,
      lastSyncDirection: 'app_to_checkfront',
      lastError: errorMessage,
      manuallyLinked: isManuallyLinked,
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
