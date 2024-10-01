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
  Td,
  Select, Text,
} from "@chakra-ui/react";
import {
  getRoomTypes,
  deleteRoomType,

} from "@/services/roomTypes";
import { getRoomCategories } from "@/services/roomCategories";
import AddEditRoomTypeForm from "./AddEditRoomTypeForm";
import {RoomCategory, RoomType} from "@/types";

export default function RoomTypesList({
  hotelId,
  onBack,
}: {
  hotelId: string;
  onBack: () => void;
}) {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [categories, setCategories] = useState<RoomCategory[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingRoomType, setEditingRoomType] = useState<RoomType | null>(null);

  useEffect(() => {
    fetchRoomTypes();
    fetchCategories();
  }, []);

  const fetchRoomTypes = async () => {
    const roomTypesData = await getRoomTypes(hotelId);
    setRoomTypes(roomTypesData);
  };

  const fetchCategories = async () => {
    const categoriesData = await getRoomCategories(hotelId);
    setCategories(categoriesData);
  };

  const handleAddRoomType = () => {
    setIsAdding(true);
  };

  const handleEditRoomType = (roomType: RoomType) => {
    setEditingRoomType(roomType);
  };

  const handleDeleteRoomType = async (roomTypeId: string) => {
    if (confirm("Are you sure you want to delete this room type?")) {
      await deleteRoomType(roomTypeId);
      fetchRoomTypes();
    }
  };

  const handleFormSubmit = () => {
    setIsAdding(false);
    setEditingRoomType(null);
    fetchRoomTypes();
  };

  const handleFormCancel = () => {
    setIsAdding(false);
    setEditingRoomType(null);
  };

  if (isAdding || editingRoomType) {
    return (
      <AddEditRoomTypeForm
        hotelId={hotelId}
        categories={categories}
        roomType={editingRoomType || undefined}
        onCancel={handleFormCancel}
        onSubmit={handleFormSubmit}
      />
    );
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.name : "Unknown";
  };

  return (
    <VStack spacing={4} align="stretch">
      <HStack justifyContent="space-between">
        <Button onClick={onBack}>Back</Button>
        <Text as={'b'} fontSize={"2xl"}>Room Types</Text>
        <Button colorScheme="teal" onClick={handleAddRoomType}>
          Add Room Type
        </Button>
      </HStack>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Category</Th>
            <Th>Quantity</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {roomTypes.map((roomType) => (
            <Tr key={roomType.id}>
              <Td>{roomType.name}</Td>
              <Td>{getCategoryName(roomType.categoryId)}</Td>
              <Td>{roomType.quantity}</Td>
              <Td>
                <HStack spacing={2} align="stretch">
                <Button size="sm" onClick={() => handleEditRoomType(roomType)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  colorScheme="red"
                  onClick={() => handleDeleteRoomType(roomType.id)}
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
