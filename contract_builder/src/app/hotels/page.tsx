"use client";

import {useState} from "react";
import {Button, VStack, Heading, Text} from "@chakra-ui/react";
import AddHotelForm from "@/components/AddHotelForm";
import ViewHotels from "@/components/ViewHotels";

interface Hotel {
  id: string;
  name: string;
  location: string;
  description: string;
  contactInfo: string;
  amenities: string;
  policies: string;
}

export default function HotelsPage() {
  const [action, setAction] = useState<null | "create" | "edit">(null);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);

  // Ensure that state resets when canceling or submitting the form
  const handleCancelorSubmit = () => {
    setAction(null);
    setEditingHotel(null);
  }

  return (
    <VStack spacing={8} p={5}>
      <Heading as="h1" size="xl" textAlign="center">
        Add / Edit Hotels
      </Heading>

      {!action && (
        <>
          <Text fontSize="lg">What would you like to do?</Text>
          <Button colorScheme="teal" size="lg" onClick={() => setAction("create")}>
            Add New Hotel
          </Button>
          <Button colorScheme="blue" size="lg" onClick={() => setAction("edit")}>
            View/Edit Existing Hotels
          </Button>
        </>
      )}

      {action === "create" && (
        <AddHotelForm setAction={handleCancelorSubmit}/>
      )}
      {action === "edit" && !editingHotel && (
        <ViewHotels setAction={setAction} setEditingHotel={setEditingHotel}/>
      )}
      {editingHotel && action === "edit" && (
        <AddHotelForm setAction={handleCancelorSubmit} editingHotel={editingHotel}/>
      )}
    </VStack>
  );
}
