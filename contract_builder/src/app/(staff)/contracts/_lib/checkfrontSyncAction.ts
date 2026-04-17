'use server'

/**
 * Server Action for Checkfront Sync
 *
 * This file must only be imported in server contexts or called as a Server Action.
 * Never import this directly in client components.
 */

import { syncContractToCheckfront } from '@/lib/integrations/checkfront'
import { getGroupContractById } from './groupContractsRepo'
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
export async function syncContractToCheckfrontAction(
  contractId: string
): Promise<CheckfrontSyncActionResult> {
  try {
    // Fetch the contract from Firestore
    const contract = await getGroupContractById(contractId)

    if (!contract) {
      return {
        success: false,
        error: 'Contract not found',
      }
    }

    // Call the Checkfront sync function (server-side only)
    const syncResult = await syncContractToCheckfront(contractId, contract)

    return {
      success: syncResult.status === 'linked',
      bookingId: syncResult.bookingId,
      status: syncResult.status,
      error: syncResult.lastError || undefined,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[CheckfrontSyncAction] Error:', errorMessage)

    return {
      success: false,
      error: errorMessage,
    }
  }
}

