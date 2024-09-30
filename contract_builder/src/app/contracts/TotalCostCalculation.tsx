import {useEffect, useState} from "react";
import {Button, HStack, Text, VStack} from "@chakra-ui/react";
import {parseDateStringAsUTC} from "@/utils/dateUtils";
import {ContractData} from "@/types";
import {getSeasons, Season} from "@/services/seasons";
import {getRates, Rate} from "@/services/rates";
import {getDivePackageById, DivePackage} from "@/services/divePackages";
import {getMealPackageById, MealPackage} from "@/services/mealPackages";
import {getHotelById, Hotel} from "@/services/hotels";
import {getRoomCategories, RoomCategory} from "@/services/roomCategories";
import {addGroupContract, GroupContract} from "@/services/groupContracts";

export default function TotalCostCalculation({
                                               contractData,
                                               onConfirm,
                                               onBack,
                                             }: {
  contractData: ContractData;
  onConfirm: () => void;
  onBack: () => void;
}) {
  const [totalCost, setTotalCost] = useState<number>(0);
  const [seasonName, setSeasonName] = useState<string>("Calculating...");
  const [season, setSeason] = useState<Season | null>(null);
  const [rates, setRates] = useState<Rate[]>([]);
  const [divePackage, setDivePackage] = useState<DivePackage | null>(null);
  const [mealPackage, setMealPackage] = useState<MealPackage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [roomCosts, setRoomCosts] = useState<{ description: string; cost: number }[]>([]);
  const [divePackageCost, setDivePackageCost] = useState<number>(0);
  const [mealPackageCost, setMealPackageCost] = useState<number>(0);
  const [totalGuests, setTotalGuests] = useState<number>(0);
  const [roomCategories, setRoomCategories] = useState<RoomCategory[]>([]);

  const handleConfirm = async () => {
    try {
      // Prepare the contract data
      const groupContract: GroupContract = {
        groupName: contractData.groupName!,
        startDate: contractData.startDate!,
        endDate: contractData.endDate!,
        hotelId: hotel!.id,
        hotelName: hotel!.name,
        seasonId: season!.id,
        seasonName: season!.name,
        bookingType: contractData.bookingType!,
        rooms: contractData.rooms!,
        roomCosts,
        totalRoomCost: roomCosts.reduce((sum, room) => sum + room.cost, 0),
        totalGuests,
        numDivers: contractData.numDivers!,
        totalNonDivers: totalGuests - (contractData.numDivers || 0),
        divePackageId: divePackage?.id,
        divePackageName: divePackage?.name,
        divePackageCost,
        mealPackageId: mealPackage?.id,
        mealPackageName: mealPackage?.name,
        mealPackageCost,
        totalCost,
        createdAt: new Date(),
        // Add other fields as needed
      };

      // Save the contract to Firestore
      const contractId = await addGroupContract(groupContract);

      // Optionally, display a success message or redirect the user
      alert("Contract saved successfully!");

      // Proceed to the next step
      onConfirm();
    } catch (error: any) {
      console.error("Error saving contract:", error);
      setError("An error occurred while saving the contract.");
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        // Check for required contract data
        if (!contractData.hotelId || !contractData.startDate || !contractData.endDate) {
          setError("Missing required contract data.");
          return;
        }

        // Fetch hotel
        const hotelData = await getHotelById(contractData.hotelId!)
        setHotel(hotelData);

        // Fetch room categories
        const categories = await getRoomCategories(contractData.hotelId);
        setRoomCategories(categories);

        // Fetch seasons
        const seasons = await getSeasons(contractData.hotelId!);
        const seasonResult = determineSeason(
          contractData.startDate!,
          contractData.endDate!,
          seasons
        );
        setSeasonName(seasonResult.name);
        setSeason(seasonResult);

        // Fetch rates
        const ratesData = await getRates(contractData.hotelId!);
        setRates(ratesData);

        // Fetch dive package
        let divePkg: DivePackage | null = null;
        if (contractData.divePackageId) {
          divePkg = await getDivePackageById(contractData.divePackageId);
          setDivePackage(divePkg);
        }

        // Fetch meal package
        let mealPkg: MealPackage | null = null;
        if (contractData.mealPackageId) {
          mealPkg = await getMealPackageById(contractData.mealPackageId);
          setMealPackage(mealPkg);
        }

        // Calculate total cost
        const {
          totalCost,
          roomCosts,
          divePackageCost,
          mealPackageCost,
          totalGuests,
        } = await calculateTotalCost(contractData, seasonResult, ratesData, divePkg, mealPkg, categories);

        setTotalCost(totalCost);
        setRoomCosts(roomCosts);
        setDivePackageCost(divePackageCost);
        setMealPackageCost(mealPackageCost);
        setTotalGuests(totalGuests);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("An error occurred while calculating the total cost.");
      }
    }

    fetchData();
  }, [contractData]);

  if (error) {
    return (
      <VStack spacing={4} align="stretch">
        <Text color="red.500">{error}</Text>
        <Button onClick={onBack}>Back</Button>
      </VStack>
    );
  }

  if (!hotel || !season) {
    return <Text>Loading data...</Text>;
  }

  return (
    <VStack spacing={4} align="stretch">
      <Text fontSize="xl" fontWeight="bold">
        Review and Confirm details for: {contractData.groupName}
      </Text>

      <Text>Hotel: {hotel.name}</Text>
      <HStack spacing={2}>
        <Text flex={1}>Check-in: {contractData.startDate}</Text>
        <Text flex={1}>Check-out: {contractData.endDate}</Text>
      </HStack>

      <HStack spacing={2}>
        <Text flex={1}>
          Number of Nights:{" "}
          {calculateNumberOfNights(contractData.startDate!, contractData.endDate!)}
        </Text>
        <Text flex={1}>Season: {seasonName}</Text>
      </HStack>

      {/* Room Breakdown */}
      <Text fontWeight="bold">Room Breakdown:</Text>
      {roomCosts.map((roomCost, index) => (
        <Text key={index}>
          {roomCost.description}: ${roomCost.cost.toFixed(2)}
        </Text>
      ))}

      <Text>Total Guests: {totalGuests}</Text>

      <HStack spacing={2}>
        <Text flex={1}>Total Divers: {contractData.numDivers}</Text>
        <Text flex={1}>
          Total Non-Divers: {totalGuests - (contractData.numDivers || 0)}
        </Text>
      </HStack>

      {divePackage && (
        <Text>
          Dive Package ({divePackage.name}): ${divePackageCost.toFixed(2)}
        </Text>
      )}

      {mealPackage && (
        <Text>
          Meal Package ({mealPackage.name}): ${mealPackageCost.toFixed(2)}
        </Text>
      )}

      <Text fontWeight="bold">Total Cost: ${totalCost.toFixed(2)}</Text>
      <HStack spacing={2}>
        <Button onClick={onBack} flex={1}>
          Back
        </Button>
        <Button colorScheme="teal" onClick={handleConfirm} flex={1}>
          Save
        </Button>
      </HStack>
    </VStack>
  );
}

function calculateNumberOfNights(startDate: string, endDate: string): number {
  const start = parseDateStringAsUTC(startDate);
  const end = parseDateStringAsUTC(endDate);
  const diffInMilliseconds = end.getTime() - start.getTime();
  return diffInMilliseconds / (1000 * 3600 * 24); // converting milliseconds to days
}

function determineSeason(
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

async function calculateTotalCost(
  contractData: ContractData,
  season: Season,
  rates: Rate[],
  divePackage: DivePackage | null,
  mealPackage: MealPackage | null,
  roomCategories: RoomCategory[]
): Promise<{
  totalCost: number;
  roomCosts: { description: string; cost: number }[];
  divePackageCost: number;
  mealPackageCost: number;
  totalGuests: number;
}> {
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

function getOccupancyNumber(occupancyType: string): number {
  switch (occupancyType.toLowerCase()) {
    case "single":
      return 1;
    case "double":
      return 2;
    case "triple":
      return 3;
    case "quad":
      return 4;
    default:
      return 0
  }
}
