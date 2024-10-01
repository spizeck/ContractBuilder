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
  addDivePackage,
  updateDivePackage,

} from "@/services/divePackages";
import {DivePackage} from "@/types";

export default function AddEditDivePackageForm({
  divePackage,
  onCancel,
  onSubmit,
}: {
  divePackage?: DivePackage;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const [divePackageData, setDivePackageData] = useState<
    Omit<DivePackage, "id">
  >({
    name: "",
    description: "",
    price: 0,
  });

  useEffect(() => {
    if (divePackage) {
      setDivePackageData({
        name: divePackage.name || "",
        description: divePackage.description || "",
        price: divePackage.price || 0,
      });
    }
  }, [divePackage]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setDivePackageData({
      ...divePackageData,
      [name]: name === "price" || name === "duration" ? parseFloat(value) : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate required fields
    if (!divePackageData.name || divePackageData.price <= 0) {
      alert("Please fill in all required fields with valid values.");
      return;
    }

    try {
      if (divePackage) {
        await updateDivePackage(divePackage.id, divePackageData);
        alert("Dive package updated successfully!");
      } else {
        await addDivePackage(divePackageData);
        alert("Dive package added successfully!");
      }
      onSubmit();
    } catch (error) {
      console.error("Error saving dive package:", error);
      alert("Failed to save dive package. Please try again.");
    }
  };

  return (
    <Box p={4} maxW="500px" mx="auto">
      <form onSubmit={handleSubmit}>
        <VStack spacing={4} p={5} align="stretch">
          <FormControl isRequired>
            <FormLabel>Name</FormLabel>
            <Input
              name="name"
              value={divePackageData.name}
              onChange={handleInputChange}
              placeholder="Enter dive package name"
            />
          </FormControl>
          <FormControl>
            <FormLabel>Description</FormLabel>
            <Textarea
              name="description"
              value={divePackageData.description}
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
              min="0"
              value={divePackageData.price}
              onChange={handleInputChange}
            />
          </FormControl>
          <HStack spacing={4} mt={2} width={"100%"}>
            <Button type="submit" colorScheme="teal" flex={"1"}>
              {divePackage ? "Update Dive Package" : "Add Dive Package"}
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
