/**
 * Checkfront Inbound Mapper
 *
 * Converts a raw Checkfront booking into a GroupContract (or a partial update).
 * All lookups use the server-side Admin SDK repos so this module is server-only.
 *
 * Category filter: only bookings that contain at least one item in
 * CHECKFRONT_GROUP_TRAVEL_CATEGORY_ID (default "3") are eligible.
 */

import {
  GroupContract,
  RoomCategory,
  RoomSelection,
  DivePackage,
  MealPackage,
  Season,
  Hotel,
  CheckfrontSyncInfo,
} from '@/app/(staff)/contracts/_types'
import {
  CheckfrontInboundBooking,
  CheckfrontBookingItem,
} from '@/lib/integrations/checkfront'
import {
  getAllRoomCategoriesServer,
  getAllDivePackagesServer,
  getAllMealPackagesServer,
  getSeasonsForHotelServer,
  getHotelByIdServer,
} from '@/app/(staff)/contracts/_lib/checkfrontServerRepos'

// ============================================================================
// Constants
// ============================================================================

export const CHECKFRONT_GROUP_TRAVEL_CATEGORY_ID =
  process.env.CHECKFRONT_GROUP_TRAVEL_CATEGORY_ID ?? '3'

// ============================================================================
// Date helpers
// ============================================================================

/**
 * Convert Checkfront YYYYMMDD date string to app YYYY-MM-DD format.
 */
function fromCheckfrontDate(date: string): string {
  if (!date || date.length < 8) return date
  return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`
}

// ============================================================================
// Mapping result types
// ============================================================================

export interface InboundMapResult {
  /** Whether the booking contains at least one Group Travel item */
  isGroupTravel: boolean
  /** Partial contract data derived from the booking (undefined if not group travel) */
  contractData?: Omit<GroupContract, 'id'>
  /** Warnings about fields that could not be auto-resolved */
  warnings: string[]
  /** The hotelId resolved from items, if any */
  resolvedHotelId?: string
}

// ============================================================================
// Reverse-lookup helpers
// ============================================================================

/**
 * Given a list of room categories and a Checkfront item ID,
 * find which category + occupancy it maps to.
 */
function reverseRoomLookup(
  categories: RoomCategory[],
  checkfrontItemId: string
): { category: RoomCategory; occupancy: string } | null {
  for (const cat of categories) {
    if (!cat.checkfrontItemIds) continue
    for (const [occupancy, itemId] of Object.entries(cat.checkfrontItemIds)) {
      if (itemId === checkfrontItemId) {
        return { category: cat, occupancy }
      }
    }
  }
  return null
}

/**
 * Given all dive packages and a Checkfront item ID, find the matching package.
 */
function reverseDivePackageLookup(
  packages: DivePackage[],
  checkfrontItemId: string
): DivePackage | null {
  return packages.find(p => p.checkfrontItemId === checkfrontItemId) ?? null
}

/**
 * Given all meal packages and a Checkfront item ID, find the matching package.
 */
function reverseMealPackageLookup(
  packages: MealPackage[],
  checkfrontItemId: string
): MealPackage | null {
  return packages.find(p => p.checkfrontItemId === checkfrontItemId) ?? null
}

/**
 * Find the season that covers a given date range for a hotel.
 * Returns the best-matching season (most overlap) or null.
 */
function matchSeason(seasons: Season[], startDate: string, endDate: string): Season | null {
  const start = new Date(startDate)
  const end = new Date(endDate)

  let best: Season | null = null
  let bestOverlap = -1

  for (const season of seasons) {
    if (season.archived) continue
    const sStart = new Date(season.startDate)
    const sEnd = new Date(season.endDate)

    const overlapStart = start > sStart ? start : sStart
    const overlapEnd = end < sEnd ? end : sEnd
    const overlap = overlapEnd.getTime() - overlapStart.getTime()

    if (overlap > bestOverlap) {
      bestOverlap = overlap
      best = season
    }
  }

  return best
}

// ============================================================================
// Main mapper
// ============================================================================

/**
 * Map a Checkfront booking to a GroupContract.
 *
 * Pass `existingContract` when updating so that fields not resolvable from
 * Checkfront (e.g. custom rates, payment info) are preserved.
 */
export async function mapCheckfrontBookingToContract(
  booking: CheckfrontInboundBooking,
  existingContract?: GroupContract
): Promise<InboundMapResult> {
  const warnings: string[] = []

  // 1. Filter: at least one item must belong to the Group Travel category
  const groupTravelItems = booking.items.filter(
    (i) => i.cat_id === CHECKFRONT_GROUP_TRAVEL_CATEGORY_ID
  )

  if (groupTravelItems.length === 0) {
    console.log(
      '[CheckfrontMapper] Booking %s has no items in category %s — skipping',
      booking.booking_id,
      CHECKFRONT_GROUP_TRAVEL_CATEGORY_ID
    )
    return { isGroupTravel: false, warnings }
  }

  console.log(
    '[CheckfrontMapper] Booking %s has %d Group Travel items — proceeding',
    booking.booking_id,
    groupTravelItems.length
  )

  // 2. Load all lookup tables in parallel
  const [allCategories, allDivePackages, allMealPackages] = await Promise.all([
    getAllRoomCategoriesServer(),
    getAllDivePackagesServer(),
    getAllMealPackagesServer(),
  ])

  // 3. Resolve room selections
  const rooms: RoomSelection[] = []
  let resolvedHotelId: string | undefined = existingContract?.hotelId

  for (const item of groupTravelItems) {
    const roomMatch = reverseRoomLookup(allCategories, item.item_id)

    if (roomMatch) {
      // Check if we already have this category+occupancy in rooms
      const existing = rooms.find(
        r => r.categoryId === roomMatch.category.id && r.occupancyType === roomMatch.occupancy
      )
      if (existing) {
        existing.numRooms += item.qty
      } else {
        rooms.push({
          categoryId: roomMatch.category.id,
          occupancyType: roomMatch.occupancy,
          numRooms: item.qty,
        })
      }

      // Infer hotelId from room category if not already set
      if (!resolvedHotelId && roomMatch.category.hotelId) {
        resolvedHotelId = roomMatch.category.hotelId
      }
    } else {
      warnings.push(
        `No room category mapping found for Checkfront item_id="${item.item_id}" (${item.name})`
      )
    }
  }

  // 4. Resolve dive package (check all booking items, not just group travel ones)
  let divePackageId: string | undefined
  let divePackageName: string | undefined | null
  let numDivers = 0

  for (const item of booking.items) {
    const diveMatch = reverseDivePackageLookup(allDivePackages, item.item_id)
    if (diveMatch) {
      divePackageId = diveMatch.id
      divePackageName = diveMatch.name
      numDivers = item.qty
      console.log(
        '[CheckfrontMapper] Dive package resolved: %s (item_id=%s qty=%d)',
        diveMatch.name,
        item.item_id,
        item.qty
      )
      break
    }
  }

  // 5. Resolve meal package
  let mealPackageId: string | undefined
  let mealPackageName: string | undefined | null

  for (const item of booking.items) {
    const mealMatch = reverseMealPackageLookup(allMealPackages, item.item_id)
    if (mealMatch) {
      mealPackageId = mealMatch.id
      mealPackageName = mealMatch.name
      console.log(
        '[CheckfrontMapper] Meal package resolved: %s (item_id=%s)',
        mealMatch.name,
        item.item_id
      )
      break
    }
  }

  // 6. Convert dates
  const startDate = fromCheckfrontDate(booking.start_date)
  const endDate = fromCheckfrontDate(booking.end_date)

  // 7. Resolve hotel info
  let hotelName = existingContract?.hotelName ?? ''
  if (resolvedHotelId) {
    const hotel = await getHotelByIdServer(resolvedHotelId)
    if (hotel) {
      hotelName = hotel.name
    } else {
      warnings.push(`Hotel not found for hotelId="${resolvedHotelId}"`)
    }
  } else {
    warnings.push('Could not resolve hotelId — no room category matched. hotelId will be empty.')
  }

  // 8. Resolve season
  let seasonId = existingContract?.seasonId ?? ''
  let seasonName = existingContract?.seasonName ?? ''

  if (resolvedHotelId) {
    const seasons = await getSeasonsForHotelServer(resolvedHotelId)
    const matchedSeason = matchSeason(seasons, startDate, endDate)
    if (matchedSeason) {
      seasonId = matchedSeason.id
      seasonName = matchedSeason.name
      console.log('[CheckfrontMapper] Season resolved: %s (%s)', matchedSeason.name, matchedSeason.id)
    } else {
      warnings.push(`No season found covering ${startDate}–${endDate} for hotel ${resolvedHotelId}`)
    }
  }

  // 9. Compute guest counts from rooms (simple sum: each room slot = 1 guest per occupancy type)
  const totalGuests =
    existingContract?.totalGuests ??
    rooms.reduce((sum, r) => {
      const perRoom =
        r.occupancyType === 'Single' ? 1
        : r.occupancyType === 'Double' ? 2
        : r.occupancyType === 'Triple' ? 3
        : r.occupancyType === 'Quad' ? 4
        : 1
      return sum + r.numRooms * perRoom
    }, 0)

  // 10. Build the sync info
  const checkfrontSync: CheckfrontSyncInfo = {
    bookingId: booking.booking_id,
    ...(booking.code ? { bookingCode: booking.code } : {}),
    status: 'linked',
    lastSyncedAt: new Date(),
    lastSyncDirection: 'checkfront_to_app',
    lastError: null,
  }

  // 11. Assemble the contract data
  // Fields that can't be computed from Checkfront are carried from existing or left as safe defaults
  const contractData: Omit<GroupContract, 'id'> = {
    // Preserve revision chain from existing contract
    ...(existingContract
      ? {
          revisionOfContractId: existingContract.revisionOfContractId,
          rootContractId: existingContract.rootContractId,
          revisionNumber: existingContract.revisionNumber,
          supersedes: existingContract.supersedes,
          supersededBy: existingContract.supersededBy,
          archivedAt: existingContract.archivedAt,
        }
      : {}),

    groupName: booking.customer_name ?? existingContract?.groupName ?? 'Unknown Group',
    startDate,
    endDate,
    hotelId: resolvedHotelId ?? existingContract?.hotelId ?? '',
    hotelName,
    seasonId,
    seasonName,
    bookingType: existingContract?.bookingType ?? 'group',
    rooms,
    roomCosts: existingContract?.roomCosts ?? [],
    totalRoomCost: existingContract?.totalRoomCost ?? 0,
    totalGuests,
    numDivers: numDivers || existingContract?.numDivers || 0,
    totalNonDivers: existingContract?.totalNonDivers ?? 0,

    ...(divePackageId
      ? { divePackageId, divePackageName: divePackageName ?? null }
      : existingContract?.divePackageId
        ? { divePackageId: existingContract.divePackageId, divePackageName: existingContract.divePackageName }
        : {}),

    ...(mealPackageId
      ? { mealPackageId, mealPackageName: mealPackageName ?? null }
      : existingContract?.mealPackageId
        ? { mealPackageId: existingContract.mealPackageId, mealPackageName: existingContract.mealPackageName }
        : {}),

    hotelAddons: existingContract?.hotelAddons ?? [],
    diveAddons: existingContract?.diveAddons ?? [],
    mealAddons: existingContract?.mealAddons ?? [],

    totalCost: existingContract?.totalCost ?? 0,
    createdAt: existingContract?.createdAt ?? new Date(),
    archived: existingContract?.archived ?? false,

    // Preserve payment fields from existing contract
    ...(existingContract
      ? {
          depositRequired: existingContract.depositRequired,
          depositPaid: existingContract.depositPaid,
          depositPaidAt: existingContract.depositPaidAt,
          depositPaidBy: existingContract.depositPaidBy,
          totalPaid: existingContract.totalPaid,
          paidInFull: existingContract.paidInFull,
          paidInFullAt: existingContract.paidInFullAt,
          paidInFullBy: existingContract.paidInFullBy,
          paymentStatus: existingContract.paymentStatus,
        }
      : {}),

    checkfrontSync,
  }

  if (warnings.length > 0) {
    console.warn('[CheckfrontMapper] Warnings for booking %s: %O', booking.booking_id, warnings)
  }

  return {
    isGroupTravel: true,
    contractData,
    warnings,
    resolvedHotelId,
  }
}
