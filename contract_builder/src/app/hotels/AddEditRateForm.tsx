import {useState, useEffect} from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  Select,
} from "@chakra-ui/react";
import {
  addRate,
  updateRate,
  Rate,
} from "@/services/rates";
import {RoomCategory} from "@/services/roomCategories";
import {Season} from "@/services/seasons";

export default function AddEditRateForm({
                                          hotelId,
                                          categories,
                                          seasons,
                                          rate,
                                          onCancel,
                                          onSubmit,
                                        }: {
  hotelId: string;
  categories: RoomCategory[];
  seasons: Season[];
  rate?: Rate;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const [rateData, setRateData] = useState<Omit<Rate, "id" | "hotelId">>({
    categoryId: "",
    seasonId: "",
    occupancyType: "",
    price: 0,
  });

  const [occupancyOptions, setOccupancyOptions] = useState<string[]>([]);

  useEffect(() => {
    if (rate) {
      setRateData({
        categoryId: rate.categoryId || "",
        seasonId: rate.seasonId || "",
        occupancyType: rate.occupancyType || "",
        price: rate.price || 0,
      });
    }
  }, [rate]);

  // Update occupancy options when category changes
  useEffect(() => {
    const selectedCategory = categories.find((cat) => cat.id === rateData.categoryId);
    if (selectedCategory) {
      setOccupancyOptions(selectedCategory.occupancyTypes);
    } else {
      setOccupancyOptions([]);
    }
    // Reset occupancyType when category changes
    setRateData((prevData) => ({
      ...prevData,
      occupancyType: "",
    }));
  }, [rateData.categoryId, categories]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const {name, value} = e.target;
    setRateData({
      ...rateData,
      [name]: name === "price" ? parseFloat(value) : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Validate required fields
    if (!rateData.categoryId || !rateData.seasonId || !rateData.occupancyType) {
      alert("Please fill in all required fields.");
      return;
    }
    try {
      if (rate) {
        await updateRate(rate.id, {...rateData, hotelId});
        alert("Rate updated successfully!");
      } else {
        await addRate({...rateData, hotelId});
        alert("Rate added successfully!");
      }
      onSubmit();
    } catch (error) {
      console.error("Error saving rate:", error);
      alert("Failed to save rate. Please try again.");
    }
  };

  // TODO: Change form to add all of the occupancy rates at the same time

  return (
    <Box p={4} maxW="500px" mx="auto">
      <form onSubmit={handleSubmit}>
        <VStack spacing={2} p={5} align="stretch">
          <FormControl isRequired>
            <FormLabel>Category</FormLabel>
            <Select
              name="categoryId"
              value={rateData.categoryId}
              onChange={handleInputChange}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Season</FormLabel>
            <Select
              name="seasonId"
              value={rateData.seasonId}
              onChange={handleInputChange}
            >
              <option value="">Select a season</option>
              {seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.name}
                </option>
              ))}
            </Select>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Occupancy Type</FormLabel>
            <Select
              name="occupancyType"
              value={rateData.occupancyType}
              onChange={handleInputChange}
            >
              <option value="">Select occupancy type</option>
              {occupancyOptions.map((occupancy) => (
                <option key={occupancy} value={occupancy}>
                  {occupancy}
                </option>
              ))}
            </Select>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Price</FormLabel>
            <Input
              name="price"
              type="number"
              step="0.01"
              value={rateData.price}
              onChange={handleInputChange}
            />
          </FormControl>

          <HStack spacing={4} mt={2} width={"100%"}>
            <Button type="submit" colorScheme="teal" flex={"1"}>
              {rate ? "Update Rate" : "Add Rate"}
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