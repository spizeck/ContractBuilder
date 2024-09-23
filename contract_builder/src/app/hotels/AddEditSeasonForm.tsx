import {useEffect, useState} from "react";
import {Box, Button, FormControl, FormLabel, HStack, Input, VStack,} from "@chakra-ui/react";
import {addSeason, Season, updateSeason} from "@/services/seasons";
import { parseDateStringAsUTC } from "@/utils/dateUtils";

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
  const [seasonData, setSeasonData] = useState<Omit<Season, "id" | "hotelId">>({
    name: "",
    startDate: "", // ISO String Format with time
    endDate: "",
  });

  useEffect(() => {
    if (season) {
      setSeasonData({
        name: season.name || "",
        startDate: season.startDate || "",
        endDate: season.endDate || "",
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
        await addSeason({...seasonData, hotelId});
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
            <Input
              name="startDate"
              type="date"
              value={seasonData.startDate}
              onChange={handleInputChange}
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>End Date</FormLabel>
            <Input
              name="endDate"
              type="date"
              value={seasonData.endDate}
              onChange={handleInputChange}
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
