'use server'

/**
 * Server Action for Checkfront Sync
 *
 * This file must only be imported in server contexts or called as a Server Action.
 * Never import this directly in client components.
 */

import { syncContractToCheckfront } from '@/lib/integrations/checkfront'
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
export async function syncContractToCheckfrontAction(
  contractId: string
): Promise<CheckfrontSyncActionResult> {
  console.log(`[CheckfrontSyncAction] Starting sync for contract: ${contractId}`)

  try {
    // Fetch the contract from Firestore using server-safe admin SDK
    console.log(`[CheckfrontSyncAction] Loading contract from Firestore...`)
    const contract = await getGroupContractByIdServer(contractId)

    if (!contract) {
      console.log(`[CheckfrontSyncAction] Contract not found: ${contractId}`)
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

