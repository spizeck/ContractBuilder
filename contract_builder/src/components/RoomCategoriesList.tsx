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
  Td, Text,
} from "@chakra-ui/react";
import {
  getRoomCategories,
  deleteRoomCategory,
  RoomCategory,
} from "@/services/roomCategories";
import AddEditRoomCategoryForm from "./AddEditRoomCategoryForm";

export default function RoomCategoriesList({
  hotelId,
  onBack,
}: {
  hotelId: string;
  onBack: () => void;
}) {
  const [categories, setCategories] = useState<RoomCategory[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingCategory, setEditingCategory] = useState<RoomCategory | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const categoriesData = await getRoomCategories(hotelId);
    setCategories(categoriesData);
  };

  const handleAddCategory = () => {
    setIsAdding(true);
  };

  const handleEditCategory = (category: RoomCategory) => {
    setEditingCategory(category);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      await deleteRoomCategory(categoryId);
      fetchCategories();
    }
  };

  const handleFormSubmit = () => {
    setIsAdding(false);
    setEditingCategory(null);
    fetchCategories();
  };

  const handleFormCancel = () => {
    setIsAdding(false);
    setEditingCategory(null);
  };

  if (isAdding || editingCategory) {
    return (
      <AddEditRoomCategoryForm
        hotelId={hotelId}
        category={editingCategory || undefined}
        onCancel={handleFormCancel}
        onSubmit={handleFormSubmit}
      />
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      <HStack justifyContent="space-between">
        <Button onClick={onBack}>Back</Button>
        <Text as={'b'} fontSize={"2xl"}>Room Categories</Text>
        <Button colorScheme="teal" onClick={handleAddCategory}>
          Add Category
        </Button>
      </HStack>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Occupancy Types</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {categories.map((category) => (
            <Tr key={category.id}>
              <Td>{category.name}</Td>
              <Td>{category.occupancyTypes.join(", ")}</Td>
              <Td>
                <HStack spacing={2} align="stretch">
                <Button size="sm" onClick={() => handleEditCategory(category)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  colorScheme="red"
                  onClick={() => handleDeleteCategory(category.id)}
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
