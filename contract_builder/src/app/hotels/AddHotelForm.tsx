import {useEffect, useState} from "react";
import {Box, Button, FormControl, FormLabel, HStack, Input, Textarea, VStack} from "@chakra-ui/react";
import {addHotel, updateHotel} from "@/services/hotels";
import {Hotel} from "@/types";

export default function AddHotelForm({
                                       editingHotel,
                                       onCancel,
                                       onSubmit,
                                     }: {
  editingHotel?: Hotel;
  onCancel: () => void;
  onSubmit: (updatedHotel: Hotel) => void;
}) {
  const [hotelData, setHotelData] = useState({
    name: "",
    location: "",
    description: "",
    contactInfo: "",
    amenities: "",
    policies: "",
  });

  useEffect(() => {
    if (editingHotel) {
      setHotelData({
        name: editingHotel.name || "",
        location: editingHotel.location || "",
        description: editingHotel.description || "",
        contactInfo: editingHotel.contactInfo || "",
        amenities: editingHotel.amenities || "",
        policies: editingHotel.policies || "",
      })
    }
  }, [editingHotel]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setHotelData({
      ...hotelData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (editingHotel) {
        await updateHotel(editingHotel.id, hotelData);
        alert("Hotel updated successfully!");
        onSubmit({id: editingHotel.id, ...hotelData});
      } else {
        const newHotelId = await addHotel(hotelData);
        alert("Hotel added successfully!");
        onSubmit({id: newHotelId as string, ...hotelData});
      }
    } catch (error) {
      console.error("Error saving hotel:", error);
      alert("Failed to save hotel. Please try again.");
    }
  };

  return (
    <Box p={4} maxW="500px" mx="auto">
      <form onSubmit={handleSubmit}>
        <VStack spacing={2} p={5} align="stretch">
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
            <Textarea
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
            <Textarea
              name="amenities"
              value={hotelData.amenities}
              onChange={handleInputChange}
              placeholder="Enter hotel amenities"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Policies</FormLabel>
            <Textarea
              name="policies"
              value={hotelData.policies}
              onChange={handleInputChange}
              placeholder="Enter hotel policies"
            />
          </FormControl>
          <HStack spacing={4} mt={2} width={"100%"}>
            <Button type="submit" colorScheme="teal" flex={"1"}>
              {editingHotel ? "Update Hotel" : "Add Hotel"}
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