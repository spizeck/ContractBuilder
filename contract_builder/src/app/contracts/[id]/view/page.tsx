"use client";

import {useEffect, useState} from "react";
import {useParams} from "next/navigation";
import {Box, Divider, Heading, Spinner, Text, VStack,} from "@chakra-ui/react";
import {getGroupContractById} from "@/services/groupContracts";
import {getHotelById} from "@/services/hotels";
import {GroupContract, Hotel} from "@/types";

export default function ViewContractPage() {
  const params = useParams();
  const {id} = params; // Firestore contract id

  const [contract, setContract] = useState<GroupContract | null>(null);
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const contractData = await getGroupContractById(id as string);
        if (contractData) {
          setContract(contractData);

          if (contractData?.hotelId) {
            const hotelData = await getHotelById(contractData.hotelId);
            setHotel(hotelData);
          }
        } else {
          console.error("Contract not found");
        }
      } catch (err) {
        console.error("Error fetching contract:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <VStack p={10}>
        <Spinner size="lg"/>
        <Text>Loading contract...</Text>
      </VStack>
    );
  }

  if (!contract || !hotel) {
    return (
      <VStack p={10}>
        <Text color="red.500">Contract not found</Text>
      </VStack>
    );
  }

  return (
    <VStack p={10} spacing={6} align="stretch">
      <Heading size="lg">Group Contract</Heading>
      <Divider/>

      {/* Contract Details */}
      <Box>
        <Heading size="md" mb={2}>
          Contract Information
        </Heading>
        <Text><b>Group Name:</b> {contract.groupName}</Text>
        <Text><b>Hotel:</b> {hotel.name}</Text>
        <Text><b>Dates:</b> {contract.startDate} → {contract.endDate}</Text>
        <Text><b>Booking Type:</b> {contract.bookingType}</Text>
        <Text><b>Total Guests:</b> {contract.totalGuests}</Text>
        <Text><b>Total Divers:</b> {contract.numDivers}</Text>
        <Text><b>Total Cost:</b> ${contract.totalCost.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
      </Box>

      {/* Rooms */}
      {contract.roomCosts?.length > 0 && (
        <Box>
          <Heading size="md" mb={2}>Room Breakdown</Heading>
          {contract.roomCosts.map((rc, idx) => (
            <Text key={idx}>
              {rc.description}: ${rc.cost.toLocaleString(undefined, {minimumFractionDigits: 2})}
            </Text>
          ))}
        </Box>
      )}

      {/* Dive Package */}
      {contract.divePackageName && (
        <Box>
          <Heading size="md" mb={2}>Dive Package</Heading>
          <Text>{contract.divePackageName}</Text>
          <Text>Cost: ${contract.divePackageCost?.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
        </Box>
      )}

      {/* Meal Package */}
      {contract.mealPackageName && (
        <Box>
          <Heading size="md" mb={2}>Meal Package</Heading>
          <Text>{contract.mealPackageName}</Text>
          <Text>Cost: ${contract.mealPackageCost?.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
        </Box>
      )}

      <Divider/>

      {/* Hotel Details */}
      <Box>
        <Heading size="md" mb={2}>Hotel Information</Heading>
        <Text><b>Location:</b> {hotel.location}</Text>
        <Text><b>Description:</b> {hotel.description}</Text>
        <Text><b>Contact:</b> {hotel.contactInfo}</Text>
        <Text><b>Amenities:</b> {hotel.amenities}</Text>
        <Text><b>Policies:</b> {hotel.policies}</Text>
      </Box>

      <Divider/>

      {/* Signature */}
      <Box mt={6}>
        <Heading size="md" mb={2}>Customer Acceptance</Heading>
        <Box border="1px solid #ccc" p={4} h="100px">
          <Text>Signature: ________________________</Text>
          <Text>Date: _____________________________</Text>
        </Box>
      </Box>
    </VStack>
  );
}