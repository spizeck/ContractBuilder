import {useEffect, useState} from "react";
import {formatInTimeZone} from "date-fns-tz";
import {Button, HStack, Table, Tbody, Td, Th, Thead, Tr, VStack, Text} from "@chakra-ui/react";
import {deleteSeason, getSeasons} from "@/services/seasons";
import AddEditSeasonForm from "./AddEditSeasonForm";
import { parseDateStringAsUTC } from "@/utils/dateUtils";
import {Season} from "@/types";

export default function SeasonsList({
                                      hotelId,
                                      onBack,
                                    }: {
  hotelId: string;
  onBack: () => void;
}) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [isAdding, SetIsAdding] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);

  useEffect(() => {
    fetchSeasons()
  }, []);

  const fetchSeasons = async () => {
    try {
      const seasonsData = await getSeasons(hotelId);
      setSeasons(seasonsData);
    } catch (error) {
      console.error("Failed to fetch seasons:", error);
    }
  }

  const handleAddSeason = () => {
    SetIsAdding(true);
  }

  const handleEditSeason = (season: Season) => {
    setEditingSeason(season);
  }

  const handleDeleteSeason = async (seasonId: string) => {
    if (confirm("Are you sure you want to delete this season?")) {
      try {
        await deleteSeason(seasonId);
        setSeasons(seasons.filter((season) => season.id !== seasonId));
      } catch (error) {
        console.error("Failed to delete season:", error);
      }
    }
  }

  const handleFormSubmit = () => {
    SetIsAdding(false);
    setEditingSeason(null);
    fetchSeasons();
  }

  const handleFormCancel = () => {
    SetIsAdding(false);
    setEditingSeason(null);
  }

  if (isAdding || editingSeason) {
    return (
      <AddEditSeasonForm
        hotelId={hotelId}
        season={editingSeason || undefined}
        onCancel={handleFormCancel}
        onSubmit={handleFormSubmit}
      />
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      <HStack justifyContent="space-between">
        <Button onClick={onBack}>Back</Button>
        <Text as={'b'} fontSize={"2xl"}>Seasons</Text>
        <Button colorScheme="teal" onClick={handleAddSeason}>
          Add Season
        </Button>
      </HStack>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Start Date</Th>
            <Th>End Date</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {/* TODO: Sort Seasons by start date */}
          {seasons.map((season) => (
            <Tr key={season.id}>
              <Td>{season.name}</Td>
              <Td>{formatInTimeZone(parseDateStringAsUTC(season.startDate), 'UTC', "MMM d, yyyy")}</Td>
              <Td>{formatInTimeZone(parseDateStringAsUTC(season.endDate), 'UTC', "MMM d, yyyy")}</Td>
              <Td>
                <HStack spacing={2} align="stretch">
                  <Button size="sm" flex={'1'} onClick={() => handleEditSeason(season)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    flex={'1'}
                    colorScheme="red"
                    onClick={() => handleDeleteSeason(season.id)}
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