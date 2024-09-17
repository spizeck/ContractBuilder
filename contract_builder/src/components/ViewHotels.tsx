"use client"


import {useEffect, useState} from "react";
import {Box, Button, Table, Tbody, Td, Th, Thead, Tr, Heading, VStack, Center} from "@chakra-ui/react";
import {getHotels} from "@/services/hotels";

interface Hotel {
  id: string;
  name: string;
  location: string;
  description: string;
}

export default function ViewHotels({
                                     setAction,
                                     setSelectedHotel,
                                   }: {
  setAction: (action: 'details' | null) => void;
  setSelectedHotel: (hotel: Hotel | null) => void;
}) {
  const [hotels, setHotels] = useState<Hotel[]>([]);

  useEffect(() => {
    const fetchHotels = async () => {
      const hotelsData = await getHotels();
      setHotels(hotelsData);
    };
    fetchHotels();
  }, []);

  const handleSelect = (hotel: Hotel) => {
    setSelectedHotel(hotel); // Set the selected hotel
    setAction('details'); // Switch to details view
  }

  return (
    <VStack spacing={8} p={5}>
      <Heading as="h2" size="lg" textAlign="center">
        Select a Hotel
      </Heading>

      <Box w="100%" overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Location</Th>
              <Th>Description</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {hotels.map((hotel) => (
              <Tr key={hotel.id}>
                <Td>{hotel.name}</Td>
                <Td>{hotel.location}</Td>
                <Td>{hotel.description}</Td>
                <Td>
                  <Button colorScheme="blue" onClick={() => handleSelect(hotel)}>
                    Select
                  </Button>
                </Td>
              </Tr>
            ))}
            {hotels.length === 0 && (
              <Tr>
                <Td colSpan={4} textAlign="center">No hotels found.</Td>
              </Tr>
            )}
          </Tbody>
        </Table>
        <Center>
          <Button mt={6} colorScheme="gray" onClick={() => setAction(null)}>
            Cancel
          </Button>
        </Center>
      </Box>
    </VStack>
  );
}