/**
 * Checkfront Integration Service
 *
 * Server-side only module for Checkfront API interactions.
 * DO NOT import this in client components - credentials must remain server-side.
 *
 * Checkfront API Flow (for future implementation):
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

import { GroupContract, CheckfrontSyncInfo } from '@/app/(staff)/contracts/_types'

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
// Booking Sync Operations (PLACEHOLDER - Phase 2 Implementation)
// ============================================================================

/**
 * TODO: Phase 2 - Create a new Checkfront booking from a GroupContract
 *
 * Checkfront Flow:
 * 1. Create or find customer via /customer/create or /customer/index
 * 2. Create session via /session/create
 * 3. Add items as slips via /item/{item_id}/slip (for each room/dive/meal)
 * 4. Create booking via /booking/create
 * 5. Return bookingId and bookingUrl
 *
 * Required mappings from checkfrontItemMappings collection
 */
export async function createBookingFromContract(
  contract: GroupContract
): Promise<CheckfrontApiResult> {
  // TODO: Implement full Checkfront booking creation flow
  // This is a placeholder that returns a structured stub result

  console.log('[Checkfront] createBookingFromContract called for contract:', contract.id)
  console.log('[Checkfront] TODO: Implement customer -> session -> slips -> booking flow')

  // Placeholder implementation
  return {
    success: false,
    error: 'Checkfront booking creation not yet implemented (Phase 2)',
  }
}

/**
 * TODO: Phase 2 - Update an existing Checkfront booking from a GroupContract
 *
 * Checkfront Flow:
 * 1. POST /booking/{booking_id}/update with modified fields
 * 2. For item changes: may need to delete and recreate slips
 *
 * Requires contract.checkfrontSync.bookingId to be set
 */
export async function updateBookingFromContract(
  contract: GroupContract
): Promise<CheckfrontApiResult> {
  // TODO: Implement full Checkfront booking update flow
  // This is a placeholder that returns a structured stub result

  const bookingId = contract.checkfrontSync?.bookingId

  console.log('[Checkfront] updateBookingFromContract called for contract:', contract.id)
  console.log('[Checkfront] Existing bookingId:', bookingId || 'none')
  console.log('[Checkfront] TODO: Implement booking/{booking_id}/update flow')

  if (!bookingId) {
    return {
      success: false,
      error: 'Cannot update: contract has no linked Checkfront bookingId',
    }
  }

  // Placeholder implementation
  return {
    success: false,
    error: 'Checkfront booking update not yet implemented (Phase 2)',
  }
}

// ============================================================================
// Sync Orchestration Helper
// ============================================================================

/**
 * Determine the appropriate sync action for a contract
 * and execute it. This is the main entry point for contract
 * save/update hook integration.
 *
 * TODO: Phase 2 - Wire this up after successful contract save
 */
export async function syncContractToCheckfront(
  contract: GroupContract
): Promise<CheckfrontSyncInfo> {
  const now = new Date()

  // Check if Checkfront is configured
  if (!isCheckfrontConfigured()) {
    return {
      status: 'not_linked',
      lastError: 'Checkfront not configured',
      lastSyncedAt: now,
      lastSyncDirection: 'app_to_checkfront',
    }
  }

  const existingBookingId = contract.checkfrontSync?.bookingId

  try {
    let result: CheckfrontApiResult

    if (existingBookingId) {
      // Future: Update existing booking
      console.log('[Checkfront] Would update booking:', existingBookingId)
      result = await updateBookingFromContract(contract)
    } else {
      // Future: Create new booking
      console.log('[Checkfront] Would create new booking for contract:', contract.id)
      result = await createBookingFromContract(contract)
    }

    if (result.success && result.bookingId) {
      return {
        bookingId: result.bookingId,
        bookingUrl: result.bookingUrl,
        status: 'linked',
        lastSyncedAt: now,
        lastSyncDirection: 'app_to_checkfront',
        lastError: null,
      }
    } else {
      return {
        bookingId: existingBookingId,
        status: existingBookingId ? 'sync_error' : 'not_linked',
        lastSyncedAt: now,
        lastSyncDirection: 'app_to_checkfront',
        lastError: result.error || 'Unknown error during sync',
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[Checkfront] Sync error:', errorMessage)

    return {
      bookingId: existingBookingId,
      status: existingBookingId ? 'sync_error' : 'not_linked',
      lastSyncedAt: now,
      lastSyncDirection: 'app_to_checkfront',
      lastError: errorMessage,
    }
  }
}
