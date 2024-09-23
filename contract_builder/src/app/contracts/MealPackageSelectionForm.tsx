import { useState, useEffect } from "react";
import {
  VStack,
  FormControl,
  FormLabel,
  Select,
  Button,
  Text,
  HStack,
} from "@chakra-ui/react";
import { MealPackage, getMealPackages } from "@/services/mealPackages";

export default function MealPackageSelectionForm({
  hotelId,
  onNext,
  onBack,
}: {
  hotelId: string;
  onNext: (data: { mealPackageId: string }) => void;
  onBack: () => void;
}) {
  const [mealPackages, setMealPackages] = useState<MealPackage[]>([]);
  const [mealPackageId, setMealPackageId] = useState("");

  useEffect(() => {
    fetchMealPackages();
  }, []);

  const fetchMealPackages = async () => {
    const packages = await getMealPackages(hotelId);
    setMealPackages(packages);
  };

  const handleSubmit = () => {
    // Validate input
    if (!mealPackageId) {
      alert("Please select a meal package.");
      return;
    }
    onNext({ mealPackageId });
  };

  return (
    <VStack spacing={4} align="stretch">
      <Text fontSize="xl" fontWeight="bold">
        Select Meal Package
      </Text>
      <FormControl isRequired>
        <FormLabel>Meal Package</FormLabel>
        <Select value={mealPackageId} onChange={(e) => setMealPackageId(e.target.value)}>
          <option value="">Select a meal package</option>
          {mealPackages.map((pkg) => (
            <option key={pkg.id} value={pkg.id}>
              {pkg.name}
            </option>
          ))}
        </Select>
      </FormControl>
      <HStack spacing={2}>
        <Button onClick={onBack}>Back</Button>
        <Button colorScheme="teal" onClick={handleSubmit}>
          Next
        </Button>
      </HStack>
    </VStack>
  );
}
