"use client";

import {useState} from "react";
import {Button, VStack, Heading, Text} from "@chakra-ui/react";
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

export default function HotelsPage() {
  const [action, setAction] = useState<null | "create" | "details">(null);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);

  const handleCancelOrSubmit = () => {
    setAction(null);          // Reset the action
    setSelectedHotel(null);   // Reset the selected hotel
  };

  return (
    <VStack spacing={8} p={5}>
      <Heading as="h1" size="xl" textAlign="center">
        {action === "create"? "Add New Hotel" : "View and Manage Hotels"  }
      </Heading>

      {!action && (
        <>
          <Text fontSize="lg">What would you like to do?</Text>
          <Button colorScheme="teal" size="lg" onClick={() => setAction("create")}>
            Add New Hotel
          </Button>
          <Button colorScheme="teal" size="lg" onClick={() => setAction("details")}>
            View and Manage Hotels
          </Button>
        </>
      )}

      {action === "create" && (
        <AddHotelForm setAction={handleCancelOrSubmit}/>
      )}

      {action === "details" && !selectedHotel && (
        <ViewHotels setAction={setAction} setSelectedHotel={setSelectedHotel}/>
      )}

      {selectedHotel && action === "details" && (
        <HotelDetails hotel={selectedHotel} setAction={setAction}/>
      )}
    </VStack>
  );
}