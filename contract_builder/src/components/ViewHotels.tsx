import {useEffect, useState} from "react";
import {Box, Button, Center, Heading, Table, Tbody, Td, Th, Thead, Tr, VStack} from "@chakra-ui/react";
import {getHotels, Hotel} from "@/services/hotels";

export default function ViewHotels({
                                     onHotelSelect,
                                     onCancel,
                                   }: {
  onHotelSelect: (hotel: Hotel) => void;
  onCancel: () => void;
}) {
  const [hotels, setHotels] = useState<Hotel[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const hotelsData = await getHotels();
        setHotels(hotelsData);
      } catch (error) {
        console.error("Failed to fetch hotels:", error);
        setHotels([]);
      }
    };

    fetchData();
  }, []);


  return (
    <VStack spacing={4} p={5} align="stretch">
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
                  <Button colorScheme="blue" onClick={() => onHotelSelect(hotel)}>
                    Select
                  </Button>
                </Td>
              </Tr>
            ))}
            {hotels.length === 0 && (
              <Tr>
                <Td colSpan={4} textAlign="center">
                  No hotels found.
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
        <Center>
          <Button mt={6} colorScheme="gray" onClick={onCancel} >
            Cancel
          </Button>
        </Center>
      </Box>
    </VStack>
  );
}