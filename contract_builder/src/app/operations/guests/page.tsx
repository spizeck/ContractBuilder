"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  HStack,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Badge,
  useToast,
} from "@chakra-ui/react";
import { FiEdit, FiTrash2, FiUpload, FiSearch } from "react-icons/fi";
import { getAllGuests, updateGuest } from "@/services/guests";
import type { Guest } from "@/types/guestTypes";

export default function GuestsPage() {
  const router = useRouter();
  const toast = useToast();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGuests();
  }, []);

  const loadGuests = async () => {
    try {
      const data = await getAllGuests();
      setGuests(data.guests || []);
    } catch (error) {
      toast({
        title: "Error loading guests",
        status: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredGuests = guests.filter(
    (guest) =>
      guest.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.bookingId?.toString().includes(searchTerm)
  );

  return (
    <Box p={6}>
      <HStack justify="space-between" mb={6}>
        <Input
          placeholder="Search guests..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          maxW="400px"
        />
        <Button
          leftIcon={<FiUpload />}
          colorScheme="blue"
          onClick={() => router.push("/operations/guests/import")}
        >
          Import CSV
        </Button>
        <Button
          leftIcon={<FiSearch />}
          colorScheme="orange"
          variant="outline"
          onClick={() => router.push("/operations/guests/reconcile")}
        >
          Reconcile Data
        </Button>
      </HStack>

      <Table>
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Booking ID</Th>
            <Th>Accommodations</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {filteredGuests.map((guest) => (
            <Tr key={guest.id}>
              <Td>{guest.fullName}</Td>
              <Td>{guest.email}</Td>
              <Td>{guest.bookingId}</Td>
              <Td>{guest.accommodations}</Td>
              <Td>
                <Badge colorScheme={getStatusColor(guest.matchStatus)}>
                  {guest.matchStatus || "unknown"}
                </Badge>
              </Td>
              <Td>
                <HStack>
                  <IconButton
                    icon={<FiEdit />}
                    aria-label="Edit"
                    size="sm"
                    onClick={() =>
                      router.push(`/operations/guests/edit/${guest.id}`)
                    }
                  />
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}

function getStatusColor(status?: string) {
  switch (status) {
    case "matched":
      return "green";
    case "unmatched":
      return "red";
    case "duplicate":
      return "orange";
    case "needs_review":
      return "yellow";
    default:
      return "gray";
  }
}
