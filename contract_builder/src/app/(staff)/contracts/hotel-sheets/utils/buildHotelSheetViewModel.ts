import {
  DivePackage,
  Hotel,
  HotelSheetCategoryRateRow,
  HotelSheetConfig,
  HotelSheetRoomInventoryRow,
  HotelSheetSeasonRates,
  HotelSheetViewModel,
  MealPackage,
  Rate,
  RoomCategory,
  RoomType,
  Season,
} from '../../_types'
import { getOccupancyCountFromLabel } from './getOccupancyCountFromLabel'

const OCCUPANCY_ORDER = ['single', 'double', 'triple', 'quad']
const occupancyWeight = (label: string) => {
  const idx = OCCUPANCY_ORDER.indexOf(label.trim().toLowerCase())
  return idx === -1 ? Number.MAX_SAFE_INTEGER : idx
}

/**
 * Builds the view model used to render the hotel price sheet preview.
 *
 * Produces two distinct room-related sections:
 *  - roomInventory: one row per RoomType (what physical rooms exist)
 *  - seasons[].categoryRates: one row per unique category+occupancy (what rates apply)
 */
export function buildHotelSheetViewModel(
  config: HotelSheetConfig,
  hotels: Hotel[],
  seasons: Season[],
  rates: Rate[],
  roomCategories: RoomCategory[],
  roomTypes: RoomType[],
  divePackages: DivePackage[],
  mealPackages: MealPackage[]
): HotelSheetViewModel {
  const hotel = hotels.find(h => h.id === config.hotelId) ?? null

  // Build a lookup map for room categories
  const categoryMap = new Map<string, RoomCategory>(
    roomCategories.map(c => [c.id, c])
  )

  // ── 1. Room inventory ──────────────────────────────────────────────────────
  // One row per non-archived RoomType, sorted by category name → room type name
  const roomInventory: HotelSheetRoomInventoryRow[] = roomTypes
    .filter(rt => !rt.archived)
    .map(rt => ({
      roomTypeId: rt.id,
      roomTypeName: rt.name,
      roomCategoryId: rt.categoryId,
      roomCategoryName: categoryMap.get(rt.categoryId)?.name ?? 'Unknown',
      quantity: rt.quantity,
      description: rt.description || undefined,
    }))
    .sort((a, b) => {
      const catCmp = a.roomCategoryName.localeCompare(b.roomCategoryName)
      if (catCmp !== 0) return catCmp
      return a.roomTypeName.localeCompare(b.roomTypeName)
    })

  // ── 2. Seasonal category rates ─────────────────────────────────────────────
  // One row per unique (categoryId + occupancyType) combination per season —
  // no expansion by room type to avoid repetition.
  const selectedSeasons: HotelSheetSeasonRates[] = config.seasonIds
    .map(seasonId => {
      const season = seasons.find(s => s.id === seasonId)
      if (!season) return null

      // Rates for this season, excluding archived
      const seasonRates = rates.filter(r => r.seasonId === seasonId && !r.archived)

      // Deduplicate by categoryId+occupancyType — keep the first price found if
      // duplicates exist (data integrity issue, not expected in practice)
      const seen = new Set<string>()
      const categoryRates: HotelSheetCategoryRateRow[] = []

      for (const rate of seasonRates) {
        const key = `${rate.categoryId}__${rate.occupancyType}`
        if (seen.has(key)) continue
        seen.add(key)

        const personCount = Math.max(1, getOccupancyCountFromLabel(rate.occupancyType))
        const nightsTotal = rate.price * config.numNights

        categoryRates.push({
          roomCategoryId: rate.categoryId,
          roomCategoryName: categoryMap.get(rate.categoryId)?.name ?? 'Unknown',
          occupancyType: rate.occupancyType,
          nightlyRate: rate.price,
          nightsTotal,
          nightsPerPerson: nightsTotal / personCount,
        })
      }

      // Sort: category name → occupancy order
      categoryRates.sort((a, b) => {
        const catCmp = a.roomCategoryName.localeCompare(b.roomCategoryName)
        if (catCmp !== 0) return catCmp
        return occupancyWeight(a.occupancyType) - occupancyWeight(b.occupancyType)
      })

      return {
        seasonId: season.id,
        seasonName: season.name,
        startDate: season.startDate,
        endDate: season.endDate,
        categoryRates,
      } satisfies HotelSheetSeasonRates
    })
    .filter((s): s is HotelSheetSeasonRates => s !== null)
    // Sort seasons chronologically
    .sort((a, b) => a.startDate.localeCompare(b.startDate))

  const selectedDivePackages = divePackages
    .filter(p => config.divePackageIds.includes(p.id) && !p.archived)
    .sort((a, b) => a.name.localeCompare(b.name))

  const selectedMealPackages = mealPackages
    .filter(p => config.mealPackageIds.includes(p.id) && !p.archived)
    .sort((a, b) => a.name.localeCompare(b.name))

  return {
    hotel,
    roomInventory,
    seasons: selectedSeasons,
    divePackages: selectedDivePackages,
    mealPackages: selectedMealPackages,
    generatedAt: new Date().toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    options: {
      includeDescription: config.includeDescription,
      includeContactInfo: config.includeContactInfo,
      includeAmenities: config.includeAmenities,
      includePolicies: config.includePolicies,
      includeRestrictions: config.includeRestrictions,
      includeLogo: config.includeLogo,
      includeMealCommissionInfo: config.includeMealCommissionInfo,
      includeOperationalNotes: config.includeOperationalNotes,
      includeCancellationPolicy: config.includeCancellationPolicy,
      includePaymentTerms: config.includePaymentTerms,
      includeForceMajeure: config.includeForceMajeure,
      includeTravelInsurance: config.includeTravelInsurance,
      includeFitnessToDive: config.includeFitnessToDive,
      includeUnusedServices: config.includeUnusedServices,
      numNights: config.numNights,
    },
  }
}
