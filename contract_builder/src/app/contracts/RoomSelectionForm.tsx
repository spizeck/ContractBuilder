import { useState, useEffect } from "react";
import {
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Select,
  Input,
  Button,
  Text,
} from "@chakra-ui/react";
import { RoomCategory, getRoomCategories } from "@/services/roomCategories";
import { Rate, getRates } from "@/services/rates";
import { Season, getSeasons } from "@/services/seasons";

interface RoomSelection {
  categoryId: string;
  occupancyType: string;
  numRooms: number;
}

export default function RoomSelectionForm({
  hotelId,
  startDate,
  endDate,
  onNext,
  onBack,
}: {
  hotelId: string;
  startDate: string;
  endDate: string;
  onNext: (data: { rooms: RoomSelection[] }) => void;
  onBack: () => void;
}) {
  const [roomCategories, setRoomCategories] = useState<RoomCategory[]>([]);
  const [rates, setRates] = useState<Rate[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [roomSelections, setRoomSelections] = useState<RoomSelection[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [categoriesData, ratesData, seasonsData] = await Promise.all([
      getRoomCategories(hotelId),
      getRates(hotelId),
      getSeasons(hotelId),
    ]);
    setRoomCategories(categoriesData);
    setRates(ratesData);
    setSeasons(seasonsData);
  };

  // Determine applicable seasons based on date range
  const applicableSeasons = seasons.filter((season) => {
    // Implement logic to check if the season overlaps with the contract dates
    const seasonStart = parseDateAsUTC(season.startDate);
    const seasonEnd = parseDateAsUTC(season.endDate);
    const contractStart = parseDateAsUTC(startDate);
    const contractEnd = parseDateAsUTC(endDate);

    return (
      (contractStart <= seasonEnd && contractEnd >= seasonStart) // Overlaps
    );
  });

  const occupancyTypes = ["Single", "Double", "Triple", "Quad"];

  const addRoomSelection = () => {
    setRoomSelections([
      ...roomSelections,
      { categoryId: "", occupancyType: "", numRooms: 0 },
    ]);
  };

  const updateRoomSelection = (index: number, field: string, value: any) => {
    const updatedSelections = [...roomSelections];
    updatedSelections[index] = {
      ...updatedSelections[index],
      [field]: field === "numRooms" ? parseInt(value) : value,
    };
    setRoomSelections(updatedSelections);
  };

  const handleSubmit = () => {
    // Validate selections
    onNext({ rooms: roomSelections });
  };

  return (
    <VStack spacing={4} align="stretch">
      <Text fontSize="xl" fontWeight="bold">
        Select Rooms
      </Text>
      {roomSelections.map((selection, index) => (
        <HStack key={index} spacing={2}>
          <FormControl isRequired>
            <FormLabel>Room Category</FormLabel>
            <Select
              value={selection.categoryId}
              onChange={(e) => updateRoomSelection(index, "categoryId", e.target.value)}
            >
              <option value="">Select a category</option>
              {roomCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Occupancy Type</FormLabel>
            <Select
              value={selection.occupancyType}
              onChange={(e) => updateRoomSelection(index, "occupancyType", e.target.value)}
            >
              <option value="">Select occupancy type</option>
              {occupancyTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Number of Rooms</FormLabel>
            <Input
              type="number"
              value={selection.numRooms}
              onChange={(e) => updateRoomSelection(index, "numRooms", e.target.value)}
            />
          </FormControl>
        </HStack>
      ))}
      <Button onClick={addRoomSelection}>Add Another Room</Button>
      <HStack spacing={2}>
        <Button onClick={onBack}>Back</Button>
        <Button colorScheme="teal" onClick={handleSubmit}>
          Next
        </Button>
      </HStack>
    </VStack>
  );
}

function parseDateAsUTC(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}
