import {parseDateStringAsUTC} from "@/utils/dateUtils";
import {ContractData, DivePackage, MealPackage, Rate, RoomCategory, Season} from "@/types";

export function calculateNumberOfNights(startDate: string, endDate: string): number {
  const start = parseDateStringAsUTC(startDate);
  const end = parseDateStringAsUTC(endDate);
  const diffInMilliseconds = end.getTime() - start.getTime();
  return diffInMilliseconds / (1000 * 3600 * 24); // converting milliseconds to days
}

export function determineSeason(
  startDate: string,
  endDate: string,
  seasons: Season[]
): Season {
  const start = parseDateStringAsUTC(startDate);
  const end = parseDateStringAsUTC(endDate);

  let maxOverlapSeason: Season | null = null;
  let maxOverlapDays = 0;

  for (const season of seasons) {
    const seasonStart = parseDateStringAsUTC(season.startDate);
    const seasonEnd = parseDateStringAsUTC(season.endDate);

    const overlapStart = Math.max(start.getTime(), seasonStart.getTime());
    const overlapEnd = Math.min(end.getTime(), seasonEnd.getTime());

    const overlapDays = (overlapEnd - overlapStart) / (1000 * 3600 * 24);

    if (overlapDays > maxOverlapDays) {
      maxOverlapDays = overlapDays;
      maxOverlapSeason = season;
    }
  }

  if (maxOverlapSeason === null) {
    throw new Error("No season found for given dates and hotel.");
  }
  return maxOverlapSeason;
}

export function getOccupancyNumber(occupancyType: string): number {
  const occupancyMap: { [key: string]: number } = {
    single: 1,
    double: 2,
    triple: 3,
    quad: 4,
  };

  const occupancy = occupancyMap[occupancyType.toLowerCase()];
  if (occupancy !== undefined) {
    return occupancy;
  } else {
    throw new Error(`Unknown occupancy type: ${occupancyType}`);
  }
}

export function calculateTotalCost(
  contractData: ContractData,
  season: Season,
  rates: Rate[],
  divePackage: DivePackage | null,
  mealPackage: MealPackage | null,
  roomCategories: RoomCategory[]
): {
  mealPackageCost: number;
  divePackageCost: number;
  totalGuests: number;
  totalCost: number;
  roomCosts: { description: string; cost: number }[]
} {
  const {
    startDate,
    endDate,
    rooms,
    numDivers,
  } = contractData;

  if (!startDate || !endDate || !rooms) {
    throw new Error("Missing required contract data.");
  }

  const numberOfNights = calculateNumberOfNights(startDate, endDate);

  // Initialize totals
  let totalGuests = 0;
  let totalRoomCost = 0;
  const roomCosts: { description: string; cost: number }[] = [];

  // Calculate Room Costs and Total Guests
  for (const room of rooms) {
    if (room.numRooms > 0 && room.categoryId && room.occupancyType) {
      const occupancyNumber = getOccupancyNumber(room.occupancyType);
      totalGuests += occupancyNumber * room.numRooms;

      // Find the matching rate
      const rate = rates.find(
        (r) =>
          r.categoryId === room.categoryId &&
          r.occupancyType.toLowerCase() === room.occupancyType.toLowerCase() &&
          r.seasonId === season.id
      );

      if (!rate) {
        throw new Error(
          `No rate found for category ${room.categoryId}, occupancy ${room.occupancyType}, season ${season.name}`
        );
      }

      // Calculate room cost
      const roomCost = room.numRooms * numberOfNights * rate.price;
      totalRoomCost += roomCost;

      // Get Room Category Name
      const category = roomCategories.find((c) => c.id === room.categoryId);
      const categoryName = category ? category.name : room.categoryId;

      // Create description
      const description = `${room.numRooms} x ${room.occupancyType} rooms in category ${categoryName} for ${numberOfNights} nights at $${rate.price.toFixed(
        2
      )}/night`;

      roomCosts.push({description, cost: roomCost});
    }
  }

  // Calculate Dive Package Cost
  let divePackageCost = 0;
  if (divePackage && numDivers) {
    divePackageCost = divePackage.price * numDivers;
  }

  // Calculate Meal Package Cost
  let mealPackageCost = 0;
  if (mealPackage && totalGuests) {
    mealPackageCost = mealPackage.price * totalGuests;
  }

  // Total Cost
  const totalCost = totalRoomCost + divePackageCost + mealPackageCost;

  return {
    totalCost,
    roomCosts,
    divePackageCost,
    mealPackageCost,
    totalGuests,
  };
}