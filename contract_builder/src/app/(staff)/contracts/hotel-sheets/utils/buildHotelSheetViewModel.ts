import {
  DivePackage,
  Hotel,
  HotelSheetConfig,
  HotelSheetSeasonRates,
  HotelSheetViewModel,
  MealPackage,
  Rate,
  RoomCategory,
  Season,
} from '../../_types'

const OCCUPANCY_ORDER = ['Single', 'Double', 'Triple', 'Quad']

/**
 * Builds the view model used to render the hotel price sheet preview.
 * Joins selected seasons, rates, and room categories into structured data.
 */
export function buildHotelSheetViewModel(
  config: HotelSheetConfig,
  hotels: Hotel[],
  seasons: Season[],
  rates: Rate[],
  roomCategories: RoomCategory[],
  divePackages: DivePackage[],
  mealPackages: MealPackage[]
): HotelSheetViewModel {
  const hotel = hotels.find(h => h.id === config.hotelId) ?? null

  // Build a lookup map for room categories
  const categoryMap = new Map<string, RoomCategory>(
    roomCategories.map(c => [c.id, c])
  )

  // Find each selected season and build rate rows for it
  const selectedSeasons: HotelSheetSeasonRates[] = config.seasonIds
    .map(seasonId => {
      const season = seasons.find(s => s.id === seasonId)
      if (!season) return null

      // Find all non-archived rates for this season
      const seasonRates = rates
        .filter(r => r.seasonId === seasonId && !r.archived)
        .map(r => ({
          categoryId: r.categoryId,
          categoryName: categoryMap.get(r.categoryId)?.name ?? 'Unknown',
          occupancyType: r.occupancyType,
          price: r.price,
        }))
        .sort((a, b) => {
          // Sort by category name first, then by occupancy order
          const catCmp = a.categoryName.localeCompare(b.categoryName)
          if (catCmp !== 0) return catCmp
          const oA = OCCUPANCY_ORDER.indexOf(a.occupancyType)
          const oB = OCCUPANCY_ORDER.indexOf(b.occupancyType)
          return oA - oB
        })

      return {
        seasonId: season.id,
        seasonName: season.name,
        startDate: season.startDate,
        endDate: season.endDate,
        rates: seasonRates,
      } satisfies HotelSheetSeasonRates
    })
    .filter((s): s is HotelSheetSeasonRates => s !== null)
    // Sort seasons by start date ascending
    .sort((a, b) => a.startDate.localeCompare(b.startDate))

  const selectedDivePackages = divePackages
    .filter(p => config.divePackageIds.includes(p.id) && !p.archived)
    .sort((a, b) => a.name.localeCompare(b.name))

  const selectedMealPackages = mealPackages
    .filter(p => config.mealPackageIds.includes(p.id) && !p.archived)
    .sort((a, b) => a.name.localeCompare(b.name))

  return {
    hotel,
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
    },
  }
}
