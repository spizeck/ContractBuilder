import { parseDateStringAsUTC } from '@shared/utils/dateUtils'
import {
  ContractData,
  DivePackage,
  Hotel,
  MealPackage,
  Rate,
  RoomCategory,
  Season,
  RoomType,
  Totals
} from '../_types'
import { parseFocRule, roundToCents } from '@shared/utils/formatters'

export function calculateNumberOfNights (
  startDate: string,
  endDate: string
): number {
  const start = parseDateStringAsUTC(startDate)
  const end = parseDateStringAsUTC(endDate)
  const diffInMilliseconds = end.getTime() - start.getTime()
  const nights = diffInMilliseconds / (1000 * 3600 * 24) // converting ms to days
  if (isNaN(nights) || nights <= 0) {
    throw new Error('End date must be after start date.')
  }
  return nights
}

export function determineSeason (
  startDate: string,
  endDate: string,
  seasons: Season[]
): Season {
  const start = parseDateStringAsUTC(startDate)
  const end = parseDateStringAsUTC(endDate)

  let maxOverlapSeason: Season | null = null
  let maxOverlapDays = 0

  for (const season of seasons) {
    const seasonStart = parseDateStringAsUTC(season.startDate)
    const seasonEnd = parseDateStringAsUTC(season.endDate)
    // endDate is inclusive (last night of the season), so add 1 day for overlap calculation
    const seasonEndExclusive = new Date(seasonEnd.getTime() + 24 * 3600 * 1000)

    const overlapStart = Math.max(start.getTime(), seasonStart.getTime())
    const overlapEnd = Math.min(end.getTime(), seasonEndExclusive.getTime())

    const overlapDays = (overlapEnd - overlapStart) / (1000 * 3600 * 24)
    if (overlapDays > maxOverlapDays) {
      maxOverlapDays = overlapDays
      maxOverlapSeason = season
    }
  }

  if (maxOverlapSeason === null) {
    throw new Error('No season found for given dates and hotel.')
  }
  return maxOverlapSeason
}

export function getOccupancyNumber (occupancyType: string): number {
  const occupancyMap: { [key: string]: number } = {
    single: 1,
    double: 2,
    triple: 3,
    quad: 4
  }
  const occupancy = occupancyMap[occupancyType.toLowerCase()]
  if (occupancy !== undefined) return occupancy
  throw new Error(`Unknown occupancy type: ${occupancyType}`)
}

export function getCommissionRate (bookingType: string): number {
  const match = bookingType.match(/\d+/)
  return match ? parseInt(match[0], 10) / 100 : 0
}

export function calculateTotalCost (
  contractData: ContractData,
  season: Season,
  rates: Rate[],
  divePackage: DivePackage | null,
  mealPackage: MealPackage | null,
  roomCategories: RoomCategory[],
  roomTypes: RoomType[],
  hotel: Hotel
): {
  totalGuests: number
  roomCosts: {
    description: string
    gross: number
    foc: number
    commission: number
    net: number
  }[]
  roomTotals: Totals
  diveTotals: Totals
  mealTotals: Omit<Totals, 'foc'>
  overall: Totals
} {
  const { startDate, endDate, rooms, numDivers, bookingType } = contractData
  if (!startDate || !endDate)
    throw new Error('Missing required contract data.')

  const nights = calculateNumberOfNights(startDate, endDate)
  const commissionRate = getCommissionRate(bookingType || '')
  const focRule = parseFocRule(hotel.focRule || '0+0')

  let totalGuests = 0
  let grossRoomCost = 0
  let focDeduction = 0
  const roomCosts: {
    description: string
    gross: number
    foc: number
    commission: number
    net: number
  }[] = []

  // For direct hotel booking, use numDivers as guest count and skip room calculations
  if (!rooms || rooms.length === 0) {
    totalGuests = numDivers || 0
  } else {
    for (const room of rooms) {
    if (room.numRooms > 0 && room.categoryId && room.occupancyType) {
      const occNum = getOccupancyNumber(room.occupancyType)
      totalGuests += occNum * room.numRooms

      const rate = rates.find(
        r =>
          r.categoryId === room.categoryId &&
          r.occupancyType.toLowerCase() === room.occupancyType.toLowerCase() &&
          r.seasonId === season.id
      )
      if (!rate)
        throw new Error(
          `No rate found for ${room.categoryId}, ${room.occupancyType}, season ${season.name}`
        )

      const gross = roundToCents(room.numRooms * nights * rate.price)
      grossRoomCost += gross

      const commission = roundToCents(gross * commissionRate)
      const net = roundToCents(gross - commission)

      const category = roomCategories.find(c => c.id === room.categoryId)
      const categoryName = category ? category.name : room.categoryId

      roomCosts.push({
        description: `${room.numRooms} x ${
          room.occupancyType
        } rooms in category ${categoryName} for ${nights} nights @ $${rate.price.toFixed(
          2
        )}/night`,
        gross,
        foc: 0, // temp, FOC applied later
        commission,
        net
      })
    }
  }
  }

  // ---- FOC calculation (after totalGuests known) ----
  // Skip FOC for direct hotel bookings since there are no room costs
  if (rooms && rooms.length > 0) {
    const focRoomType = roomTypes.find(
      rt => rt.hotelId === hotel.id && rt.isFocBase
    )
    if (focRoomType) {
      const baseRate = rates.find(
        r => 
          r.categoryId === focRoomType.categoryId && 
          r.seasonId === season.id && 
          r.occupancyType.toLowerCase() === 'double'
      )
      if (baseRate) {
        const perGuestPerNight = roundToCents(baseRate.price / 2) // assume double occupancy
        const focGroupSize = focRule.paid + focRule.free
        const freeGuests = focGroupSize > 0 && focRule.free > 0
          ? Math.floor(totalGuests / focGroupSize) * focRule.free
          : 0
        focDeduction = roundToCents(freeGuests * perGuestPerNight * nights)
      }
    }
  }

  // Add hotel addons to room gross before commission calculation
  const hotelAddonTotal = roundToCents((contractData.hotelAddons || []).reduce((sum, addon) => sum + addon.amount, 0))
  const grossRoomCostWithAddons = roundToCents(grossRoomCost + hotelAddonTotal)
  
  const adjustedGross = roundToCents(grossRoomCostWithAddons - focDeduction)
  const roomTotals: Totals = {
    gross: grossRoomCostWithAddons,
    foc: focDeduction,
    commission: roundToCents(adjustedGross * commissionRate),
    net: roundToCents(adjustedGross * (1 - commissionRate))
  }

  // ---- Dives ----
  let diveTotals: Totals = { gross: 0, foc: 0, commission: 0, net: 0 }
  if (divePackage && numDivers) {
    const divePackageGross = roundToCents(divePackage.price * numDivers)
    const diveAddonTotal = roundToCents((contractData.diveAddons || []).reduce((sum, addon) => sum + addon.amount, 0))
    const gross = roundToCents(divePackageGross + diveAddonTotal)
    const diveFocGroupSize = focRule.paid + focRule.free
    const diveFreeGuests = diveFocGroupSize > 0 && focRule.free > 0
      ? Math.floor(numDivers / diveFocGroupSize) * focRule.free
      : 0
    const foc = roundToCents(diveFreeGuests * divePackage.price)
    const adjustedGross = roundToCents(gross - foc)
    diveTotals = {
      gross,
      foc,
      commission: roundToCents(adjustedGross * commissionRate),
      net: roundToCents(adjustedGross * (1 - commissionRate))
    }
  }

  // ---- Meals ----
  let mealTotals: Omit<Totals, 'foc'> = { gross: 0, commission: 0, net: 0 }
  if (mealPackage && totalGuests) {
    const mealPackageGross = roundToCents(mealPackage.price * totalGuests)
    const mealAddonTotal = roundToCents((contractData.mealAddons || []).reduce((sum, addon) => sum + addon.amount, 0))
    const gross = roundToCents(mealPackageGross + mealAddonTotal)
    const commission = roundToCents(gross * (mealPackage.commissionRate ?? 0))
    mealTotals = { gross, commission, net: roundToCents(gross - commission) }
  }

  // ---- Overall ----
  const overall: Totals = {
    gross: roundToCents(roomTotals.gross + diveTotals.gross + mealTotals.gross),
    foc: roundToCents((roomTotals.foc ?? 0) + (diveTotals.foc ?? 0)),
    commission: roundToCents(
      roomTotals.commission + diveTotals.commission + mealTotals.commission
    ),
    net: roundToCents(roomTotals.net + diveTotals.net + mealTotals.net)
  }

  return { totalGuests, roomCosts, roomTotals, diveTotals, mealTotals, overall }
}
