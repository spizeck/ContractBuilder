"use client"


import {useEffect, useState} from "react";
import {Box, Button, Table, Tbody, Td, Th, Thead, Tr, Heading, VStack} from "@chakra-ui/react";
import {getHotels} from "@/services/hotels";

interface Hotel {
  id: string;
  name: string;
  location: string;
  description: string;
}

export default function ViewHotels({setAction, setEditingHotel}: {
  setAction: (action: "edit" | null) => void,
  setEditingHotel: (hotel: Hotel | null) => void
}) {
  const [hotels, setHotels] = useState<Hotel[]>([]);

  useEffect(() => {
    const fetchHotels = async () => {
      const hotelsData = await getHotels();
      setHotels(hotelsData);
    };

    fetchHotels();
  }, []);

  // Handle when user clicks edit on a hotel
  const handleEdit = (hotel: Hotel) => {
    setEditingHotel(hotel);  // Set the selected hotel for editing
    setAction("edit");  // Switch to edit mode
  };

  return (
    <VStack spacing={8} p={5}>
      <Heading as="h2" size="lg" textAlign="center">
        Select Hotel or Edit Basic Hotel Information
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
                  <Button colorScheme="blue" onClick={() => handleEdit(hotel)}>
                    Edit
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </VStack>
  );
}