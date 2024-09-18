import { useState } from "react";
import { Box, Button, Input, FormControl, FormLabel, VStack, HStack } from "@chakra-ui/react";
import { addHotel } from "@/services/hotels";

export default function AddHotelForm({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const [hotelData, setHotelData] = useState({
    name: "",
    location: "",
    description: "",
    contactInfo: "",
    amenities: "",
    policies: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHotelData({
      ...hotelData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await addHotel(hotelData);
      alert("Hotel added successfully!");
      onSubmit();
    } catch (error) {
      console.error("Error adding hotel:", error);
      alert("Failed to add hotel. Please try again.");
    }
  };

  return (
    <Box p={5} maxW="500px" mx="auto">
      <form onSubmit={handleFormSubmit}>
        <VStack spacing={4}>
          <FormControl isRequired>
            <FormLabel>Hotel Name</FormLabel>
            <Input
              name="name"
              value={hotelData.name}
              onChange={handleInputChange}
              placeholder="Enter hotel name"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Location</FormLabel>
            <Input
              name="location"
              value={hotelData.location}
              onChange={handleInputChange}
              placeholder="Enter hotel location"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Description</FormLabel>
            <Input
              name="description"
              value={hotelData.description}
              onChange={handleInputChange}
              placeholder="Enter hotel description"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Contact Info</FormLabel>
            <Input
              name="contactInfo"
              value={hotelData.contactInfo}
              onChange={handleInputChange}
              placeholder="Enter contact info"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Amenities</FormLabel>
            <Input
              name="amenities"
              value={hotelData.amenities}
              onChange={handleInputChange}
              placeholder="Enter hotel amenities"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Policies</FormLabel>
            <Input
              name="policies"
              value={hotelData.policies}
              onChange={handleInputChange}
              placeholder="Enter hotel policies"
            />
          </FormControl>

          <HStack spacing={4}>
            <Button type="submit" colorScheme="teal">
              Add Hotel
            </Button>
            <Button onClick={onCancel} colorScheme="gray">
              Cancel
            </Button>
          </HStack>
        </VStack>
      </form>
    </Box>
  );
}