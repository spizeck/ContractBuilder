// HotelsPageContent.tsx
"use client";

import { useState } from "react";
import { Button, VStack, Heading, Text } from "@chakra-ui/react";
import AddHotelForm from "@/components/AddHotelForm";
import ViewHotels from "@/components/ViewHotels";
import HotelDetails from "@/components/HotelDetails";

interface Hotel {
  id: string;
  name: string;
  location: string;
  description: string;
  contactInfo: string;
  amenities: string;
  policies: string;
}

type ActionState = null | "createHotel" | "viewHotels" | "viewHotelDetails";

export default function HotelsPageContent() {
  const [action, setAction] = useState<ActionState>(null);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);

  // Reset to the main menu
  const resetToMainMenu = () => {
    setAction(null);
    setSelectedHotel(null);
  };

  // Go back to the hotel list
  const backToHotelList = () => {
    setAction("viewHotels");
    setSelectedHotel(null);
  };

  // Handle hotel selection
  const handleHotelSelect = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    setAction("viewHotelDetails");
  };

  return (
    <VStack spacing={8} p={5}>
      <Heading as="h1" size="xl" textAlign="center">
        {action === "createHotel"
          ? "Add New Hotel"
          : action === "viewHotels"
          ? "View and Manage Hotels"
          : action === "viewHotelDetails"
          ? `Hotel Details: ${selectedHotel?.name}`
          : "Manage Hotels"}
      </Heading>

      {/* Main Menu */}
      {!action && (
        <>
          <Text fontSize="lg">What would you like to do?</Text>
          <Button colorScheme="teal" size="lg" onClick={() => setAction("createHotel")}>
            Add New Hotel
          </Button>
          <Button colorScheme="teal" size="lg" onClick={() => setAction("viewHotels")}>
            View and Manage Hotels
          </Button>
        </>
      )}

      {/* Add Hotel Form */}
      {action === "createHotel" && (
        <AddHotelForm onCancel={resetToMainMenu} onSubmit={resetToMainMenu} />
      )}

      {/* View Hotels List */}
      {action === "viewHotels" && (
        <ViewHotels onHotelSelect={handleHotelSelect} onCancel={resetToMainMenu} />
      )}

      {/* Hotel Details */}
      {action === "viewHotelDetails" && selectedHotel && (
        <HotelDetails hotel={selectedHotel} onBack={backToHotelList} />
      )}
    </VStack>
  );
}
