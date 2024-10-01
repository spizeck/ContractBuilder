"use client"

import {useEffect, useState} from "react";
import {Button, HStack, Table, Tbody, Td, Text, Th, Thead, Tr, VStack,} from "@chakra-ui/react";
import {deleteDivePackage, getDivePackages,} from "@/services/divePackages";
import AddEditDivePackageForm from "./AddEditDivePackageForm";
import {DivePackage} from "@/types";

export default function DivePackagesList() {
  const [divePackages, setDivePackages] = useState<DivePackage[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingDivePackage, setEditingDivePackage] = useState<DivePackage | null>(null);

  useEffect(() => {
    fetchDivePackages();
  }, []);

  const fetchDivePackages = async () => {
    try {
      const packages = await getDivePackages();
      setDivePackages(packages);
    } catch (error) {
      console.error("Failed to fetch dive packages:", error);
    }
  };

  const handleAddDivePackage = () => {
    setIsAdding(true);
  };

  const handleEditDivePackage = (divePackage: DivePackage) => {
    setEditingDivePackage(divePackage);
  };

  const handleDeleteDivePackage = async (divePackageId: string) => {
    if (confirm("Are you sure you want to delete this dive package?")) {
      try {
        await deleteDivePackage(divePackageId);
        fetchDivePackages();
      } catch (error) {
        console.error("Failed to delete dive package:", error);
      }
    }
  };

  const handleFormSubmit = () => {
    setIsAdding(false);
    setEditingDivePackage(null);
    fetchDivePackages();
  };

  const handleFormCancel = () => {
    setIsAdding(false);
    setEditingDivePackage(null);
  };

  if (isAdding || editingDivePackage) {
    return (
      <AddEditDivePackageForm
        divePackage={editingDivePackage || undefined}
        onCancel={handleFormCancel}
        onSubmit={handleFormSubmit}
      />
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      <HStack justifyContent="space-between">
        <Text fontSize="2xl" fontWeight="bold">
          Dive Packages
        </Text>
        <Button colorScheme="teal" onClick={handleAddDivePackage}>
          Add New
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
          {divePackages.map((divePackage) => (
            <Tr key={divePackage.id}>
              <Td>{divePackage.name}</Td>
              <Td>{divePackage.description}</Td>
              <Td>${divePackage.price.toFixed(2)}</Td>
              <Td>
                <HStack spacing={2}>
                  <Button size="sm" onClick={() => handleEditDivePackage(divePackage)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="red"
                    onClick={() => handleDeleteDivePackage(divePackage.id)}
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