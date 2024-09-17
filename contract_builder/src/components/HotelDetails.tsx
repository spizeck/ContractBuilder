"use client";

import {useState} from "react";
import {Box, Button, Heading, VStack, Text} from "@chakra-ui/react";

interface Hotel {
  id: string;
  name: string;
  location: string;
  description: string;
}

export default function HotelDetails({
                                       hotel,
                                       setAction,
                                     }: {
  hotel: Hotel;
  setAction: (action: null) => void;
}) {
  const [seasons, setSeasons] = useState([]);  // Placeholder for seasons
  const [roomTypes, setRoomTypes] = useState([]);  // Placeholder for room types
  const [mealPackages, setMealPackages] = useState([]);  // Placeholder for meal packages
  const [rates, setRates] = useState([]);  // Placeholder for rates

  const handleGoBack = () => {
    setAction(null);  // Go back to the main list
  };

  return (
    <VStack spacing={8} p={5}>
      <Heading as="h2" size="lg" textAlign="center">
        Hotel Details: {hotel.name}
      </Heading>

      <Box>
        <Text fontWeight="bold">Location:</Text>
        <Text>{hotel.location}</Text>

        <Text fontWeight="bold" mt={4}>Description:</Text>
        <Text>{hotel.description}</Text>
      </Box>

      <VStack align="start" spacing={4} w="100%">
        <Heading as="h3" size="md">Manage Seasons</Heading>
        {/* Add logic for managing seasons */}
        <Button colorScheme="blue">Add Season</Button>

        <Heading as="h3" size="md">Manage Room Types</Heading>
        {/* Add logic for managing room types */}
        <Button colorScheme="blue">Add Room Type</Button>

        <Heading as="h3" size="md">Manage Meal Packages</Heading>
        {/* Add logic for managing meal packages */}
        <Button colorScheme="blue">Add Meal Package</Button>

        <Heading as="h3" size="md">Manage Rates</Heading>
        {/* Add logic for managing rates */}
        <Button colorScheme="blue">Add Rate</Button>
      </VStack>

      <Button colorScheme="gray" onClick={handleGoBack}>
        Back to Hotel List
      </Button>
    </VStack>
  );
}
