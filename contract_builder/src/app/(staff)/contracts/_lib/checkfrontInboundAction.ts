'use server'

/**
 * Server Action: Checkfront Inbound Sync
 *
 * Fetches a Checkfront booking by ID and upserts the corresponding
 * GroupContract in Firestore. Only bookings containing items in the
 * Group Travel category (default cat_id "3") are processed.
 *
 * This is the primary entry point for:
 *  - The webhook route handler  (src/app/api/webhooks/checkfront/route.ts)
 *  - The manual admin trigger   (called from the admin UI for testing)
 */

import {
  fetchCheckfrontBooking,
  isCheckfrontConfigured,
} from '@/lib/integrations/checkfront'
import { mapCheckfrontBookingToContract } from '@/lib/integrations/checkfrontInboundMapper'
import {
  getGroupContractByCheckfrontBookingIdServer,
  createGroupContractServer,
  updateGroupContractServer,
  createCheckfrontSyncLogServer,
} from './checkfrontServerRepos'

// ============================================================================
// Result types
// ============================================================================

export type InboundSyncOutcome =
  | 'created'     // A new GroupContract was created
  | 'updated'     // An existing GroupContract was updated
  | 'skipped'     // Booking doesn't belong to Group Travel category
  | 'error'       // Something went wrong

export interface InboundSyncResult {
  outcome: InboundSyncOutcome
  bookingId: string
  contractId?: string
  warnings?: string[]
  error?: string
}

// ============================================================================
// Main action
// ============================================================================

/**
 * Fetch a Checkfront booking and upsert the corresponding GroupContract.
 *
 * @param bookingId - Checkfront booking ID (numeric string, e.g. "7999")
 */
export async function upsertContractFromCheckfront(
  bookingId: string
): Promise<InboundSyncResult> {
  console.log('[CheckfrontInbound] START bookingId=%s', bookingId)

  if (!isCheckfrontConfigured()) {
    console.warn('[CheckfrontInbound] Checkfront not configured — aborting inbound sync')
    return {
      outcome: 'error',
      bookingId,
      error: 'Checkfront is not configured (missing env vars)',
    }
  }

  // 1. Fetch booking from Checkfront
  const fetchResult = await fetchCheckfrontBooking(bookingId)
  if (!fetchResult.success || !fetchResult.data) {
    console.error('[CheckfrontInbound] Failed to fetch booking %s: %s', bookingId, fetchResult.error)
    return {
      outcome: 'error',
      bookingId,
      error: fetchResult.error ?? 'Failed to fetch booking from Checkfront',
    }
  }

  const booking = fetchResult.data
  console.log(
    '[CheckfrontInbound] Booking fetched: id=%s code=%s status=%s items=%d',
    booking.booking_id,
    booking.code ?? 'none',
    booking.status ?? 'unknown',
    booking.items.length
  )

  // 2. Check for an existing contract linked to this booking
  const existingContract = await getGroupContractByCheckfrontBookingIdServer(bookingId)

  // 3. Map booking to contract data
  const mapResult = await mapCheckfrontBookingToContract(booking, existingContract ?? undefined)

  if (!mapResult.isGroupTravel) {
    console.log('[CheckfrontInbound] Booking %s is not Group Travel — skipping', bookingId)
    return { outcome: 'skipped', bookingId }
  }

  if (!mapResult.contractData) {
    return {
      outcome: 'error',
      bookingId,
      error: 'Mapper returned no contract data despite isGroupTravel=true',
    }
  }

  const contractData = mapResult.contractData

  // 4. Upsert
  let contractId: string
  let outcome: InboundSyncOutcome

  try {
    if (existingContract) {
      contractId = existingContract.id
      outcome = 'updated'
      console.log('[CheckfrontInbound] Updating existing contract %s', contractId)

      await updateGroupContractServer(contractId, contractData)

      await createCheckfrontSyncLogServer(contractId, {
        action: 'inbound_update',
        success: true,
        requestSummary: { bookingId, bookingCode: booking.code },
        responseSummary: {
          contractId,
          warnings: mapResult.warnings.length > 0 ? mapResult.warnings : undefined,
        },
        error: null,
      })
    } else {
      outcome = 'created'
      console.log('[CheckfrontInbound] Creating new contract for booking %s', bookingId)

      contractId = await createGroupContractServer(contractData)

      await createCheckfrontSyncLogServer(contractId, {
        action: 'inbound_create',
        success: true,
        requestSummary: { bookingId, bookingCode: booking.code },
        responseSummary: {
          contractId,
          warnings: mapResult.warnings.length > 0 ? mapResult.warnings : undefined,
        },
        error: null,
      })
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[CheckfrontInbound] Firestore upsert failed for booking %s: %s', bookingId, errorMessage)

    return {
      outcome: 'error',
      bookingId,
      error: errorMessage,
      warnings: mapResult.warnings,
    }
  }

  console.log(
    '[CheckfrontInbound] %s contractId=%s bookingId=%s warnings=%d',
    outcome.toUpperCase(),
    contractId,
    bookingId,
    mapResult.warnings.length
  )

  return {
    outcome,
    bookingId,
    contractId,
    warnings: mapResult.warnings.length > 0 ? mapResult.warnings : undefined,
  }
}

// ============================================================================
// Manual test trigger (admin use only)
// ============================================================================

/**
 * Manually trigger an inbound sync for a specific Checkfront booking ID.
 * Intended for admin/dev testing without waiting for a live webhook.
 */
export async function triggerInboundSyncAction(
  bookingId: string
): Promise<InboundSyncResult> {
  console.log('[CheckfrontInbound][manualTrigger] bookingId=%s', bookingId)
  return upsertContractFromCheckfront(bookingId)
}
