"use client";  // Required to allow React hooks like useState

import { useState } from "react";
import { VStack, Input, FormControl, FormLabel, Select, Button } from "@chakra-ui/react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export function CreateContractForm() {
  const [groupName, setGroupName] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [hotel, setHotel] = useState("");
  const [bookingType, setBookingType] = useState("");

  const handleNext = () => {
    console.log({ groupName, startDate, endDate, hotel, bookingType });
  };

  return (
    <VStack spacing={4} align="start">
      <FormControl isRequired>
        <FormLabel>Group Name</FormLabel>
        <Input
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Enter group name"
        />
      </FormControl>

      <FormControl isRequired>
        <FormLabel>Start Date</FormLabel>
        <DatePicker
          selected={startDate}
          onChange={(date: Date | null) => setStartDate(date)}
          dateFormat="yyyy-MM-dd"
          placeholderText="Select start date"
        />
      </FormControl>

      <FormControl isRequired>
        <FormLabel>End Date</FormLabel>
        <DatePicker
          selected={endDate}
          onChange={(date: Date | null) => setEndDate(date)}
          dateFormat="yyyy-MM-dd"
          placeholderText="Select end date"
        />
      </FormControl>

      <FormControl isRequired>
        <FormLabel>Hotel</FormLabel>
        <Select
          placeholder="Select hotel"
          value={hotel}
          onChange={(e) => setHotel(e.target.value)}
        >
          <option value="Hotel ABC">Hotel ABC</option>
          <option value="Hotel XYZ">Hotel XYZ</option>
        </Select>
      </FormControl>

      <FormControl isRequired>
        <FormLabel>Booking Type</FormLabel>
        <Select
          placeholder="Select booking type"
          value={bookingType}
          onChange={(e) => setBookingType(e.target.value)}
        >
          <option value="tourOperator">Tour Operator</option>
          <option value="diveShop">Dive Shop</option>
        </Select>
      </FormControl>

      <Button colorScheme="teal" onClick={handleNext}>
        Next: Room Selection
      </Button>
    </VStack>
  );
}
