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
import { customerService } from "@/services/customers";
import type { Customer } from "@/types/manifestTypes";

export default function CustomersPage() {
  const router = useRouter();
  const toast = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await customerService.getAllCustomers();
      setCustomers(data);
    } catch (error) {
      toast({
        title: "Error loading customers",
        status: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.emailLower?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phoneE164?.includes(searchTerm)
  );

  return (
    <Box p={6}>
      <HStack justify="space-between" mb={6}>
        <Input
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          maxW="400px"
        />
        <Button
          leftIcon={<FiUpload />}
          colorScheme="blue"
          onClick={() => router.push("/operations/customers/import")}
        >
          Import CSV
        </Button>
      </HStack>

      <Table>
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Phone</Th>
            <Th>Certification</Th>
            <Th>Last Dive</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {filteredCustomers.map((customer) => (
            <Tr key={customer.id}>
              <Td>{customer.fullName}</Td>
              <Td>{customer.emailLower}</Td>
              <Td>{customer.phoneE164}</Td>
              <Td>
                <Badge colorScheme={customer.certVerified ? "green" : "gray"}>
                  {customer.certLevel || "Not certified"}
                </Badge>
              </Td>
              <Td>{customer.lastDiveDate || "Unknown"}</Td>
              <Td>
                <HStack>
                  <IconButton
                    aria-label="Edit customer"
                    icon={<FiEdit />}
                    size="sm"
                    onClick={() => router.push(`/operations/customers/${customer.id}/edit`)}
                  />
                  <IconButton
                    aria-label="Delete customer"
                    icon={<FiTrash2 />}
                    size="sm"
                    colorScheme="red"
                    onClick={() => {/* TODO: Add delete functionality */}}
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
