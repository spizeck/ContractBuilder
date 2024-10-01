import { useState, useEffect } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  Textarea,
} from "@chakra-ui/react";
import {
  addMealPackage,
  updateMealPackage,

} from "@/services/mealPackages";
import {MealPackage} from "@/types";

export default function AddEditMealPackageForm({
  hotelId,
  mealPackage,
  onCancel,
  onSubmit,
}: {
  hotelId: string;
  mealPackage?: MealPackage;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const [mealPackageData, setMealPackageData] = useState<
    Omit<MealPackage, "id" | "hotelId">
  >({
    name: "",
    description: "",
    price: 0,
  });

  useEffect(() => {
    if (mealPackage) {
      setMealPackageData({
        name: mealPackage.name || "",
        description: mealPackage.description || "",
        price: mealPackage.price || 0,
      });
    }
  }, [mealPackage]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setMealPackageData({
      ...mealPackageData,
      [name]: name === "price" ? parseFloat(value) : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!mealPackageData.name) {
      alert("Please enter a name for the meal package.");
      return;
    }

    try {
      if (mealPackage) {
        await updateMealPackage(mealPackage.id, { ...mealPackageData, hotelId });
        alert("Meal package updated successfully!");
      } else {
        await addMealPackage({ ...mealPackageData, hotelId });
        alert("Meal package added successfully!");
      }
      onSubmit();
    } catch (error) {
      console.error("Error saving meal package:", error);
      alert("Failed to save meal package. Please try again.");
    }
  };

  return (
    <Box p={4} maxW="500px" mx="auto">
      <form onSubmit={handleSubmit}>
        <VStack spacing={2} p={5} align="stretch">
          <FormControl isRequired>
            <FormLabel>Name</FormLabel>
            <Input
              name="name"
              value={mealPackageData.name}
              onChange={handleInputChange}
              placeholder="Enter meal package name"
            />
          </FormControl>
          <FormControl>
            <FormLabel>Description</FormLabel>
            <Textarea
              name="description"
              value={mealPackageData.description}
              onChange={handleInputChange}
              placeholder="Enter description"
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Price</FormLabel>
            <Input
              name="price"
              type="number"
              step="0.01"
              value={mealPackageData.price}
              onChange={handleInputChange}
            />
          </FormControl>
          <HStack spacing={4} mt={2} align={'stretch'}>
            <Button type="submit" colorScheme="teal" flex={"1"} minW={'150px'}>
              {mealPackage ? "Update Meal Package" : "Add Meal Package"}
            </Button>
            <Button onClick={onCancel} colorScheme="gray" flex={"1"} minW={'150px'}>
              Cancel
            </Button>
          </HStack>
        </VStack>
      </form>
    </Box>
  );
}
