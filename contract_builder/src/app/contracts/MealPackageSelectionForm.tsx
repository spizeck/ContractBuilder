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
import { getMealPackages } from "@/services/mealPackages";
import { MealPackage } from "@/types/contractTypes";

export default function MealPackageSelectionForm({
  hotelId,
  onNext,
  onBack,
  initialMealPackageId = "",
}: {
  hotelId: string;
  onNext: (data: { mealPackageId: string }) => void;
  onBack: () => void;
  initialMealPackageId?: string;
}) {
  const [mealPackages, setMealPackages] = useState<MealPackage[]>([]);
  const [mealPackageId, setMealPackageId] = useState(initialMealPackageId);

  useEffect(() => {
    const fetchMealPackages = async () => {
      const packages = await getMealPackages(hotelId);
      setMealPackages(packages);
    };

    fetchMealPackages();
  }, [hotelId]);

  useEffect(() => {
    setMealPackageId(initialMealPackageId || "");
  }, [initialMealPackageId]);

  const handleSubmit = () => {
    if (!mealPackageId) {
      alert("Please select a meal package.");
      return;
    }
    // console.log("Selected meal package:", mealPackageId);
    onNext({ mealPackageId });
  };

  return (
    <VStack spacing={4} align="stretch">
      <Text fontSize="xl" fontWeight="bold">
        Select Meal Package
      </Text>

      <FormControl isRequired>
        <FormLabel>Meal Package</FormLabel>
        <Select
          value={mealPackageId}
          onChange={(e) => setMealPackageId(e.target.value)}
        >
          <option value="">Select a meal package</option>
          {mealPackages.map((pkg) => (
            <option key={pkg.id} value={pkg.id}>
              {pkg.name}
            </option>
          ))}
        </Select>

        {/* Optional description */}
        {mealPackageId && (
          <Text fontSize="sm" color="gray.600">
            {mealPackages.find((pkg) => pkg.id === mealPackageId)?.description}
          </Text>
        )}
      </FormControl>

      <HStack spacing={2}>
        <Button onClick={onBack} flex={1}>
          Back
        </Button>
        <Button colorScheme="teal" onClick={handleSubmit} flex={1}>
          Next
        </Button>
      </HStack>
    </VStack>
  );
}
