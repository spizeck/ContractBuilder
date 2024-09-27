import {Button, HStack, Text, VStack} from "@chakra-ui/react";
import {parseDateStringAsUTC} from "@/utils/dateUtils";
import {ContractData} from "@/types";
import {getSeasons} from "@/services/seasons";

export default function TotalCostCalculation({
                                               contractData,
                                               onConfirm,
                                               onBack,
                                             }: {
  contractData: ContractData; // Replace with appropriate type
  onConfirm: () => void;
  onBack: () => void;
}) {
  // Perform calculations here
  const totalCost = calculateTotalCost(contractData);

  return (
    <VStack spacing={4} align="stretch">
      <Text fontSize="xl" fontWeight="bold">
        Review and Confirm details for: {contractData.groupName}
      </Text>
      {/* Display detailed breakdown */}
      <Text>Hotel: {contractData.hotelId}</Text>
      <HStack spacing={2}>
        <Text flex={1}>Check-in: {contractData.startDate}</Text>
        <Text flex={1}>Check-out: {contractData.endDate}</Text>
      </HStack>
      <HStack spacing={2}>
        <Text>Number of Nights: {calculateNumberOfNights(contractData.startDate, contractData.endDate)}</Text>
      </HStack>
      {/* Breakdown of rooms excluding any blanks */}
      <Text>Room Breakdown:</Text>
      {/* Iterate through the rooms and display the selected category */}
      <HStack spacing={2}>
        <Text flex={1}>Total Divers: {contractData.numDivers}</Text>
        <Text flex={1}>Total Non-Divers: </Text>
      </HStack>
      <Text>Selected Dive Package: {contractData.divePackageId}</Text>
      <Text>Selected Meal Package: {contractData.mealPackageId}</Text>

      <Text>Total Cost: ${totalCost.toFixed(2)}</Text>
      <HStack spacing={2}>
        <Button onClick={onBack} flex={1}>Back</Button>
        <Button colorScheme="teal" onClick={onConfirm} flex={1}>
          Save
        </Button>
      </HStack>
    </VStack>
  );
}

function calculateTotalCost(contractData: any): number {
  console.log(contractData);

  return 0; // Placeholder
}

function calculateNumberOfNights(startDate: string, endDate: string): number {
  const start = parseDateStringAsUTC(startDate);
  const end = parseDateStringAsUTC(endDate);
  const diffInMilliseconds = end.getTime() - start.getTime();
  return diffInMilliseconds / (1000 * 3600 * 24); // converting milliseconds to days
}

async function determineSeason(startDate: string, endDate: string, hotelId: string) {
  const seasons = await getSeasons(hotelId);
  const start = parseDateStringAsUTC(startDate);
  const end = parseDateStringAsUTC(endDate);

  let maxOverlapSeason = seasons[0];
  let maxOverlapDays = 0;

  for (const season of seasons) {
    const seasonStart = parseDateStringAsUTC(season.startDate);
    const seasonEnd = parseDateStringAsUTC(season.endDate);

    const overlapStart = Math.max(start.getTime(), seasonStart.getTime());
    const overlapEnd = Math.min(end.getTime(), seasonEnd.getTime());

    const overlapDays = (overlapEnd - overlapStart) / (1000 * 3600 * 24);

    if (overlapDays > maxOverlapDays) {
      maxOverlapSeason = season;
      maxOverlapDays = overlapDays;
    }
  }

  if (maxOverlapDays === 0) {
    throw new Error("No season found for the given dates");
  }
  return maxOverlapSeason.name;
}

function calculateOccupancyCost(
  numberOfNights: number,
  hotelId: string,
  categoryId: string,
  seasonId: string,
  occupancyType: string,
  numRooms: number,
): number {

}