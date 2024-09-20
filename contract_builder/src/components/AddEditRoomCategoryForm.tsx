import { useState, useEffect } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  CheckboxGroup,
  Checkbox,
} from "@chakra-ui/react";
import {
  addRoomCategory,
  updateRoomCategory,
  RoomCategory,
} from "@/services/roomCategories";

export default function AddEditRoomCategoryForm({
  hotelId,
  category,
  onCancel,
  onSubmit,
}: {
  hotelId: string;
  category?: RoomCategory;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const [categoryData, setCategoryData] = useState<Omit<RoomCategory, "id" | "hotelId">>({
    name: "",
    occupancyTypes: [],
  });

  useEffect(() => {
    if (category) {
      setCategoryData({
        name: category.name || "",
        occupancyTypes: category.occupancyTypes || [],
      });
    }
  }, [category]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCategoryData({
      ...categoryData,
      [e.target.name]: e.target.value,
    });
  };

  const handleOccupancyChange = (values: string[]) => {
    setCategoryData({
      ...categoryData,
      occupancyTypes: values,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (category) {
      await updateRoomCategory(category.id, categoryData);
    } else {
      await addRoomCategory({ ...categoryData, hotelId });
    }
    onSubmit();
  };

  const occupancyOptions = ["Single", "Double", "Triple", "Quad"];

  return (
    <Box p={4} maxW="500px" mx="auto">
      <form onSubmit={handleSubmit}>
        <VStack spacing={2} p={5} align="stretch">
          <FormControl isRequired>
            <FormLabel>Category Name</FormLabel>
            <Input
              name="name"
              value={categoryData.name}
              onChange={handleInputChange}
              placeholder="Enter category name"
            />
          </FormControl>
          <FormControl>
            <FormLabel>Occupancy Types</FormLabel>
            <CheckboxGroup
              value={categoryData.occupancyTypes}
              onChange={handleOccupancyChange}
            >
              <HStack spacing={4}>
                {occupancyOptions.map((option) => (
                  <Checkbox key={option} value={option}>
                    {option}
                  </Checkbox>
                ))}
              </HStack>
            </CheckboxGroup>
          </FormControl>
          <HStack spacing={4} mt={2} width={"100%"}>
            <Button type="submit" colorScheme="teal" flex={"1"}>
              {category ? "Update Category" : "Add Category"}
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
