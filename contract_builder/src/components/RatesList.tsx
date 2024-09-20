import { useEffect, useState } from "react";
import {
  VStack,
  HStack,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Select, Text,
} from "@chakra-ui/react";
import {
  getRates,
  deleteRate,
  Rate,
} from "@/services/rates";
import { getRoomCategories, RoomCategory } from "@/services/roomCategories";
import { getSeasons, Season } from "@/services/seasons";
import AddEditRateForm from "./AddEditRateForm";

export default function RatesList({
  hotelId,
  onBack,
}: {
  hotelId: string;
  onBack: () => void;
}) {
  const [rates, setRates] = useState<Rate[]>([]);
  const [categories, setCategories] = useState<RoomCategory[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingRate, setEditingRate] = useState<Rate | null>(null);

  useEffect(() => {
    fetchRates();
    fetchCategories();
    fetchSeasons();
  }, []);

  const fetchRates = async () => {
    const ratesData = await getRates(hotelId);
    setRates(ratesData);
  };

  const fetchCategories = async () => {
    const categoriesData = await getRoomCategories(hotelId);
    setCategories(categoriesData);
  };

  const fetchSeasons = async () => {
    const seasonsData = await getSeasons(hotelId);
    setSeasons(seasonsData);
  };

  const handleAddRate = () => {
    setIsAdding(true);
  };

  const handleEditRate = (rate: Rate) => {
    setEditingRate(rate);
  };

  const handleDeleteRate = async (rateId: string) => {
    if (confirm("Are you sure you want to delete this rate?")) {
      await deleteRate(rateId);
      fetchRates();
    }
  };

  const handleFormSubmit = () => {
    setIsAdding(false);
    setEditingRate(null);
    fetchRates();
  };

  const handleFormCancel = () => {
    setIsAdding(false);
    setEditingRate(null);
  };

  if (isAdding || editingRate) {
    return (
      <AddEditRateForm
        hotelId={hotelId}
        categories={categories}
        seasons={seasons}
        rate={editingRate || undefined}
        onCancel={handleFormCancel}
        onSubmit={handleFormSubmit}
      />
    );
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.name : "Unknown";
  };

  const getSeasonName = (seasonId: string) => {
    const season = seasons.find((s) => s.id === seasonId);
    return season ? season.name : "Unknown";
  };

  return (
    <VStack spacing={4} align="stretch">
      <HStack justifyContent="space-between">
        <Button onClick={onBack}>Back</Button>
        <Text as={'b'} fontSize={"2xl"}>Rates</Text>
        <Button colorScheme="teal" onClick={handleAddRate}>
          Add Rate
        </Button>
      </HStack>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Category</Th>
            <Th>Season</Th>
            <Th>Occupancy Type</Th>
            <Th>Price per Night</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {rates.map((rate) => (
            <Tr key={rate.id}>
              <Td>{getCategoryName(rate.categoryId)}</Td>
              <Td>{getSeasonName(rate.seasonId)}</Td>
              <Td>{rate.occupancyType}</Td>
              <Td>{rate.price.toFixed(2)}</Td>
              <Td>
                <HStack spacing={2} align={'stretch'}>
                  <Button size="sm" onClick={() => handleEditRate(rate)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="red"
                    onClick={() => handleDeleteRate(rate.id)}
                  >
                    Delete
                  </Button>
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </VStack>
  );
}
