import {useEffect, useState} from "react";
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from "@chakra-ui/react";
import {
  getMealPackages,
  deleteMealPackage,

} from "@/services/mealPackages";
import AddEditMealPackageForm from "./AddEditMealPackageForm";
import {MealPackage} from "@/types";

export default function MealPackagesList({
                                           hotelId,
                                           onBack,
                                         }: {
  hotelId: string;
  onBack: () => void;
}) {
  const [mealPackages, setMealPackages] = useState<MealPackage[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingMealPackage, setEditingMealPackage] = useState<MealPackage | null>(null);

  useEffect(() => {
    fetchMealPackages();
  }, []);

  const fetchMealPackages = async () => {
    const mealPackagesData = await getMealPackages(hotelId);
    setMealPackages(mealPackagesData);
  };

  const handleAddMealPackage = () => {
    setIsAdding(true);
  };

  const handleEditMealPackage = (mealPackage: MealPackage) => {
    setEditingMealPackage(mealPackage);
  };

  const handleDeleteMealPackage = async (mealPackageId: string) => {
    if (confirm("Are you sure you want to delete this meal package?")) {
      await deleteMealPackage(mealPackageId);
      fetchMealPackages();
    }
  };

  const handleFormSubmit = () => {
    setIsAdding(false);
    setEditingMealPackage(null);
    fetchMealPackages();
  };

  const handleFormCancel = () => {
    setIsAdding(false);
    setEditingMealPackage(null);
  };

  if (isAdding || editingMealPackage) {
    return (
      <AddEditMealPackageForm
        hotelId={hotelId}
        mealPackage={editingMealPackage || undefined}
        onCancel={handleFormCancel}
        onSubmit={handleFormSubmit}
      />
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      <HStack justifyContent="space-between">
        <Button onClick={onBack}>Back</Button>
        <Text as={'b'} fontSize={"2xl"}>Meal Packages</Text>
        <Button colorScheme="teal" onClick={handleAddMealPackage}>
          Add Meal Package
        </Button>
      </HStack>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Description</Th>
            <Th>Price</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {mealPackages.map((mealPackage) => (
            <Tr key={mealPackage.id}>
              <Td>{mealPackage.name}</Td>
              <Td>{mealPackage.description}</Td>
              <Td>${mealPackage.price.toFixed(2)}</Td>
              <Td>
                <HStack spacing={2}>
                  <Button size="sm" onClick={() => handleEditMealPackage(mealPackage)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="red"
                    onClick={() => handleDeleteMealPackage(mealPackage.id)}
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
