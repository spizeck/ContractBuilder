'use server'

/**
 * Server Action for Checkfront Sync
 *
 * This file must only be imported in server contexts or called as a Server Action.
 * Never import this directly in client components.
 */

import {
  syncContractToCheckfront,
  buildCheckfrontPayloadFromContract,
  isCheckfrontConfigured,
} from '@/lib/integrations/checkfront'
import { getGroupContractByIdServer } from './checkfrontServerRepos'
import { GroupContract } from '../_types'

export interface CheckfrontSyncActionResult {
  success: boolean
  bookingId?: string
  status?: string
  error?: string
}

/**
 * Server Action: Sync a contract to Checkfront
 * Reads the contract from Firestore and triggers Checkfront sync
 */
export interface CheckfrontDryRunResult {
  configured: boolean
  contractFound: boolean
  existingBookingId?: string
  payloadBuilt: boolean
  payloadItemCount?: number
  payloadErrors?: string[]
  wouldAction?: 'create_booking' | 'update_booking'
  warnings: string[]
}

/**
 * Server Action: Dry-run Checkfront sync for a contract
 * Checks config, loads contract, builds payload, and reports what would happen
 * without making any real API calls or writing to Firestore.
 */
export async function dryRunCheckfrontSync(
  contractId: string
): Promise<CheckfrontDryRunResult> {
  const warnings: string[] = []

  const configured = isCheckfrontConfigured()
  if (!configured) {
    warnings.push('Checkfront is not configured - missing env vars CHECKFRONT_API_KEY, CHECKFRONT_API_SECRET, or CHECKFRONT_API_BASE_URL')
  }

  const contract = await getGroupContractByIdServer(contractId)
  if (!contract) {
    return { configured, contractFound: false, payloadBuilt: false, warnings }
  }

  const existingBookingId = contract.checkfrontSync?.bookingId
  const wouldAction: 'create_booking' | 'update_booking' = existingBookingId ? 'update_booking' : 'create_booking'

  if (contract.checkfrontSync?.manuallyLinked && existingBookingId) {
    warnings.push(`Contract has a manually linked bookingId: ${existingBookingId}`)
  }

  // Try building the payload to check mappings
  let payloadBuilt = false
  let payloadItemCount: number | undefined
  let payloadErrors: string[] | undefined

  try {
    const payload = await buildCheckfrontPayloadFromContract(contract)
    if (payload) {
      payloadBuilt = true
      payloadItemCount = payload.items.length
      if (!payload.customer.email) {
        warnings.push('Contract has no customer email - Checkfront customer creation may fail or create incomplete records')
      }
      if (payload.items.length === 0) {
        warnings.push('No bookable items resolved - check room/dive/meal Checkfront ID mappings')
      }
    } else {
      payloadBuilt = false
      payloadErrors = ['buildCheckfrontPayloadFromContract returned null - no items resolved from mappings']
    }
  } catch (err) {
    payloadBuilt = false
    payloadErrors = [err instanceof Error ? err.message : String(err)]
  }

  return {
    configured,
    contractFound: true,
    existingBookingId,
    payloadBuilt,
    payloadItemCount,
    payloadErrors,
    wouldAction,
    warnings,
  }
}

export async function syncContractToCheckfrontAction(
  contractId: string
): Promise<CheckfrontSyncActionResult> {
  console.log('[CheckfrontSyncAction] Starting sync for contract: %s', contractId)

  try {
    // Fetch the contract from Firestore using server-safe admin SDK
    console.log('[CheckfrontSyncAction] Loading contract from Firestore...')
    const contract = await getGroupContractByIdServer(contractId)

    if (!contract) {
      console.log('[CheckfrontSyncAction] Contract not found: %s', contractId)
      return {
        success: false,
        error: 'Contract not found',
      }
    }

    console.log(`[CheckfrontSyncAction] Contract loaded: ${contract.groupName}`)
    console.log(`[CheckfrontSyncAction] Calling Checkfront sync...`)

    // Call the Checkfront sync function (server-side only)
    const syncResult = await syncContractToCheckfront(contractId, contract)

    console.log(`[CheckfrontSyncAction] Sync result:`, {
      success: syncResult.status === 'linked',
      status: syncResult.status,
      bookingId: syncResult.bookingId,
      error: syncResult.lastError,
    })

    return {
      success: syncResult.status === 'linked',
      bookingId: syncResult.bookingId,
      status: syncResult.status,
      error: syncResult.lastError || undefined,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[CheckfrontSyncAction] Error during sync:`, errorMessage)
    console.error(`[CheckfrontSyncAction] Full error:`, error)

    return {
      success: false,
      error: errorMessage,
    }
  }
}

