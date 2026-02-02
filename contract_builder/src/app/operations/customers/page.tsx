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
  Text,
  VStack,
  Tooltip,
} from "@chakra-ui/react";
import { FiEdit, FiTrash2, FiUpload, FiSearch, FiCheck, FiShield } from "react-icons/fi";
import { customerService } from "@/services/customers";
import type { Customer } from "@/types/manifestTypes";
import { Timestamp } from "firebase/firestore";

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
      customer.certLevel?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRentalGearCount = (customer: Customer) => {
    const gear = customer.gearDefault;
    let count = 0;
    if (gear.bcd?.needRental) count++;
    if (gear.regulator?.needRental) count++;
    if (gear.wetsuit?.needRental) count++;
    if (gear.fins?.needRental) count++;
    if (gear.mask?.needRental) count++;
    if (gear.computer?.needRental) count++;
    return count;
  };

  const getRentalGearItems = (customer: Customer) => {
    const gear = customer.gearDefault;
    const items = [];
    if (gear.bcd?.needRental) items.push("BCD");
    if (gear.regulator?.needRental) items.push("Reg");
    if (gear.wetsuit?.needRental) items.push("Wet");
    if (gear.fins?.needRental) items.push("Fins");
    if (gear.mask?.needRental) items.push("Mask");
    if (gear.computer?.needRental) items.push("Comp");
    return items;
  };

  const handleVerifyCertification = async (customer: Customer) => {
    try {
      const now = Timestamp.now();
      await customerService.updateCustomer(customer.id, {
        certVerified: true,
        certVerifiedAt: now,
        certVerifiedBy: "current_user", // TODO: Get actual user ID
      });
      
      // Update local state
      setCustomers(prev => 
        prev.map(c => 
          c.id === customer.id 
            ? { ...c, certVerified: true, certVerifiedAt: now, certVerifiedBy: "current_user" }
            : c
        )
      );
      
      toast({
        title: "Certification verified",
        description: `${customer.fullName}'s certification has been verified`,
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error verifying certification",
        status: "error",
        duration: 3000,
      });
    }
  };

  const handleVerifyNitrox = async (customer: Customer) => {
    try {
      const now = Timestamp.now();
      await customerService.updateCustomer(customer.id, {
        nitroxVerified: true,
        nitroxVerifiedAt: now,
        nitroxVerifiedBy: "current_user", // TODO: Get actual user ID
      });
      
      // Update local state
      setCustomers(prev => 
        prev.map(c => 
          c.id === customer.id 
            ? { ...c, nitroxVerified: true, nitroxVerifiedAt: now, nitroxVerifiedBy: "current_user" }
            : c
        )
      );
      
      toast({
        title: "Nitrox verified",
        description: `${customer.fullName}'s nitrox certification has been verified`,
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error verifying nitrox",
        status: "error",
        duration: 3000,
      });
    }
  };

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
            <Th>Certification</Th>
            <Th>Nitrox</Th>
            <Th>Rental Gear</Th>
            <Th>Last Dive</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {filteredCustomers.map((customer) => (
            <Tr key={customer.id}>
              <Td fontWeight="medium">{customer.fullName}</Td>
              <Td>
                <HStack>
                  <Badge colorScheme={customer.certVerified ? "green" : "gray"}>
                    {customer.certLevel || "Not certified"}
                  </Badge>
                  {customer.certVerified && (
                    <Tooltip label="Certification verified">
                      <FiCheck color="green" />
                    </Tooltip>
                  )}
                </HStack>
              </Td>
              <Td>
                <HStack>
                  {customer.nitroxCertified ? (
                    <>
                      <Badge colorScheme="purple">Nitrox</Badge>
                      {customer.nitroxVerified && (
                        <Tooltip label="Nitrox verified">
                          <FiCheck color="green" />
                        </Tooltip>
                      )}
                    </>
                  ) : (
                    <Text color="textMuted">Air</Text>
                  )}
                </HStack>
              </Td>
              <Td>
                {getRentalGearCount(customer) > 0 ? (
                  <VStack align="start" spacing={0}>
                    <Badge colorScheme="blue">
                      {getRentalGearCount(customer)} items
                    </Badge>
                    <Text fontSize="xs" color="textMuted">
                      {getRentalGearItems(customer).join(", ")}
                    </Text>
                  </VStack>
                ) : (
                  <Text color="textMuted">None</Text>
                )}
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
                  {!customer.certVerified && customer.certLevel && (
                    <Tooltip label="Verify certification">
                      <IconButton
                        aria-label="Verify certification"
                        icon={<FiShield />}
                        size="sm"
                        colorScheme="green"
                        variant="outline"
                        onClick={() => handleVerifyCertification(customer)}
                      />
                    </Tooltip>
                  )}
                  {customer.nitroxCertified && !customer.nitroxVerified && (
                    <Tooltip label="Verify nitrox">
                      <IconButton
                        aria-label="Verify nitrox"
                        icon={<FiShield />}
                        size="sm"
                        colorScheme="purple"
                        variant="outline"
                        onClick={() => handleVerifyNitrox(customer)}
                      />
                    </Tooltip>
                  )}
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
