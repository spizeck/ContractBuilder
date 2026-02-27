import { useEffect, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Input,
  VStack,
} from "@chakra-ui/react";
import { addSeason, updateSeason } from "@/services/seasons";
import { parseDateStringAsUTC } from "@/utils/dateUtils";
import { Season } from "@/types/contractTypes";
import { ensureRatesForSeason } from "@/services/rateSync";
import CustomDatePicker from "@/components/DatePicker";
import { toInputDate, parseDateOnly } from "@/utils/formatters";

export default function AddEditSeasonForm({
  hotelId,
  season,
  onCancel,
  onSubmit,
}: {
  hotelId: string;
  season?: Season;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const [seasonData, setSeasonData] = useState<
    Omit<Season, "id" | "hotelId">
  >({
    name: "",
    startDate: "",
    endDate: "",
    archived: false,
  });

  useEffect(() => {
    if (season) {
      setSeasonData({
        name: season.name || "",
        startDate: season.startDate || "",
        endDate: season.endDate || "",
        archived: season.archived || false,
      });
    }
  }, [season]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSeasonData({
      ...seasonData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const startDate = parseDateStringAsUTC(seasonData.startDate);
    const endDate = parseDateStringAsUTC(seasonData.endDate);
    if (startDate >= endDate) {
      alert("End date must be after start date.");
      return;
    }

    try {
      if (season) {
        await updateSeason(season.id, seasonData);
        alert("Season updated successfully!");
      } else {
        const newSeasonId = await addSeason({ ...seasonData, hotelId });
        // 🔹 Backfill rates for all categories
        await ensureRatesForSeason(hotelId, newSeasonId);
        alert("Season added successfully!");
      }
      onSubmit();
    } catch (error) {
      console.error("Error saving season:", error);
      alert("Failed to save season. Please try again.");
    }
  };

  return (
    <Box p={4} maxW="500px" mx="auto">
      <form onSubmit={handleSubmit}>
        <VStack spacing={2} p={5} align="stretch">
          <FormControl isRequired>
            <FormLabel>Season Name</FormLabel>
            <Input
              name="name"
              value={seasonData.name}
              onChange={handleInputChange}
              placeholder="Enter season name"
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Start Date</FormLabel>
            <CustomDatePicker
              selected={seasonData.startDate ? parseDateOnly(seasonData.startDate) : null}
              onChange={(date: Date | null) => {
                setSeasonData({
                  ...seasonData,
                  startDate: date ? toInputDate(date) : '',
                });
              }}
              placeholder="Select start date"
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>End Date</FormLabel>
            <CustomDatePicker
              selected={seasonData.endDate ? parseDateOnly(seasonData.endDate) : null}
              onChange={(date: Date | null) => {
                setSeasonData({
                  ...seasonData,
                  endDate: date ? toInputDate(date) : '',
                });
              }}
              placeholder="Select end date"
            />
          </FormControl>
          <HStack spacing={4} mt={2} width={"100%"}>
            <Button type="submit" colorScheme="teal" flex={"1"}>
              {season ? "Update Season" : "Add Season"}
            </Button>
            <Button onClick={onCancel} colorScheme="gray" flex={"1"}>
              Cancel
            </Button>
          </HStack>
        </VStack>
      </form>
    </Box>
  );
}
