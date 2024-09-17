"use client"

import {useState, useEffect, Dispatch, SetStateAction} from "react";
import {Box, Button, Input, FormControl, FormLabel, VStack, HStack} from "@chakra-ui/react";
import {addHotel, editHotel, deleteHotel} from "@/services/hotels";

interface Hotel {
  id: string
  name: string
  location: string
  description: string
  contactInfo: string
  amenities: string
  policies: string
}

interface AddHotelFormProps {
  setAction: Dispatch<SetStateAction<'create' | 'edit' | null>>
}

export default function AddHotelForm({
                                       setAction,
                                       editingHotel,
                                     }: {
  setAction: (action: null) => void;
  editingHotel?: Hotel | null
}) {
  const [hotelData, setHotelData] = useState({
    name: '',
    location: '',
    description: '',
    contactInfo: '',
    amenities: '',
    policies: '',
  })

  useEffect(() => {
    if (editingHotel) {
      setHotelData({
        name: editingHotel?.name || '',
        location: editingHotel?.location || '',
        description: editingHotel?.description || '',
        contactInfo: editingHotel?.contactInfo || '',
        amenities: editingHotel?.amenities || '',
        policies: editingHotel?.policies || '',
      })
    }
  }, [editingHotel])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHotelData({
      ...hotelData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (editingHotel) {
        await editHotel(editingHotel.id, hotelData)
        alert("Hotel updated successfully!");
      } else {
        await addHotel(hotelData);
        alert("Hotel added successfully!");
      }
      setAction(null); // Go back to the previous state after success
    } catch (error) {
      console.error("Error saving hotel:", error);
      alert("Failed to save hotel. Please try again.");
    }
  };

  const handleCancel = () => {
    setAction(null)
  }

  return (
    <Box p={5} maxW="500px" mx="auto">
      <form onSubmit={handleSubmit}>
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
              {editingHotel ? "Update Hotel" : "Add Hotel"}
            </Button>
            <Button onClick={handleCancel} colorScheme="gray">
              Cancel
            </Button>
          </HStack>
        </VStack>
      </form>
    </Box>
  );
}