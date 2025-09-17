import {parseDateStringAsUTC} from '@/utils/dateUtils'
import {ContractData, DivePackage, Hotel, MealPackage, Rate, RoomCategory, Season} from '@/types'
import {parseFocRule} from "@/utils/formatters"

export function calculateNumberOfNights(startDate: string, endDate: string): number {
  const start = parseDateStringAsUTC(startDate)
  const end = parseDateStringAsUTC(endDate)
  const diffInMilliseconds = end.getTime() - start.getTime()
  return diffInMilliseconds / (1000 * 3600 * 24) // converting ms to days
}

export function determineSeason(startDate: string, endDate: string, seasons: Season[]): Season {
  const start = parseDateStringAsUTC(startDate)
  const end = parseDateStringAsUTC(endDate)

  let maxOverlapSeason: Season | null = null
  let maxOverlapDays = 0

  for (const season of seasons) {
    const seasonStart = parseDateStringAsUTC(season.startDate)
    const seasonEnd = parseDateStringAsUTC(season.endDate)

    const overlapStart = Math.max(start.getTime(), seasonStart.getTime())
    const overlapEnd = Math.min(end.getTime(), seasonEnd.getTime())

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

export function getOccupancyNumber(occupancyType: string): number {
  const occupancyMap: { [key: string]: number } = {
    single: 1,
    double: 2,
    triple: 3,
    quad: 4,
  }
  const occupancy = occupancyMap[occupancyType.toLowerCase()]
  if (occupancy !== undefined) return occupancy
  throw new Error(`Unknown occupancy type: ${occupancyType}`)
}

export function getCommissionRate(bookingType: string): number {
  const match = bookingType.match(/\d+/)
  return match ? parseInt(match[0], 10) / 100 : 0
}

export function calculateTotalCost(
  contractData: ContractData,
  season: Season,
  rates: Rate[],
  divePackage: DivePackage | null,
  mealPackage: MealPackage | null,
  roomCategories: RoomCategory[],
  hotel: Hotel
): {
  totalGuests: number
  roomCosts: { description: string; gross: number; foc: number; commission: number; net: number }[]
  roomTotals: { gross: number; foc: number; commission: number; net: number }
  diveTotals: { gross: number; foc: number; commission: number; net: number }
  mealTotals: { gross: number; commission: number; net: number }
  overall: { gross: number; foc: number; commission: number; net: number }
} {
  const {startDate, endDate, rooms, numDivers, bookingType} = contractData
  if (!startDate || !endDate || !rooms) throw new Error('Missing required contract data.')

  const nights = calculateNumberOfNights(startDate, endDate)
  const commissionRate = getCommissionRate(bookingType || "")
  const focRule = parseFocRule(hotel.focRule || "0+0")

  // ---- Rooms ----
  let totalGuests = 0
  let grossRoomCost = 0
  let focDeduction = 0
  const roomCosts: { description: string; gross: number; foc: number; commission: number; net: number }[] = []

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
      if (!rate) throw new Error(`No rate found for category ${room.categoryId}, occupancy ${room.occupancyType}, season ${season.name}`)

      const gross = room.numRooms * nights * rate.price
      grossRoomCost += gross

      let foc = 0
      if (hotel.focBaseRate && room.categoryId === hotel.focBaseRate) {
        const focGuests = Math.floor(totalGuests / (focRule.paid + focRule.free))
        foc = focGuests * rate.price * nights
      }

      const commission = (gross - foc) * commissionRate
      const net = gross - foc - commission

      const category = roomCategories.find(c => c.id === room.categoryId)
      const categoryName = category ? category.name : room.categoryId

      roomCosts.push({
        description: `${room.numRooms} x ${room.occupancyType} rooms in category ${categoryName} for ${nights} nights @ $${rate.price.toFixed(2)}/night`,
        gross,
        foc,
        commission,
        net,
      })

      focDeduction += foc
    }
  }

  const roomTotals = {
    gross: grossRoomCost,
    foc: focDeduction,
    commission: (grossRoomCost - focDeduction) * commissionRate,
    net: (grossRoomCost - focDeduction) * (1 - commissionRate),
  }

  // ---- Dives ----
  let diveTotals = {gross: 0, foc: 0, commission: 0, net: 0}
  if (divePackage && numDivers) {
    const gross = divePackage.price * numDivers
    const foc = Math.floor(numDivers / 8) * divePackage.price
    const commission = (gross - foc) * commissionRate
    diveTotals = {gross, foc, commission, net: gross - foc - commission}
  }

  // ---- Meals ----
  let mealTotals = {gross: 0, commission: 0, net: 0}
  if (mealPackage && totalGuests) {
    const gross = mealPackage.price * totalGuests
    const mealRate = hotel.mealCommissionRate ?? 0
    const commission = gross * mealRate
    mealTotals = {gross, commission, net: gross - commission}
  }

  // ---- Overall ----
  const overall = {
    gross: roomTotals.gross + diveTotals.gross + mealTotals.gross,
    foc: roomTotals.foc + diveTotals.foc,
    commission: roomTotals.commission + diveTotals.commission + mealTotals.commission,
    net: roomTotals.net + diveTotals.net + mealTotals.net,
  }

  return {totalGuests, roomCosts, roomTotals, diveTotals, mealTotals, overall}
}
