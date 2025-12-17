"use client";

import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Card,
  CardBody,
  Input,
  Select,
  Badge,
  SimpleGrid,
  useToast,
  Alert,
  AlertIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Divider,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { FiTruck, FiClock, FiMapPin, FiUsers, FiDownload, FiPlus, FiX, FiEdit } from "react-icons/fi";
import { 
  Customer, 
  DiveSlot, 
  DiveAssignment, 
  TaxiAssignment,
  Taxi 
} from "@/types/manifestTypes";

// Mock data
const mockTaxis: Taxi[] = [
  { id: 1, name: "Taxi 1 - John", capacity: 8, driverContact: "+1234567890", active: true },
  { id: 2, name: "Taxi 2 - Maria", capacity: 6, driverContact: "+1234567891", active: true },
];

const mockDiveSlots: DiveSlot[] = [
  {
    id: "slot1",
    date: new Date(),
    boatId: "boat1",
    slotNumber: 1,
    departureTime: "08:00",
    returnTime: "10:30",
    maxDivers: 12,
    currentAssignments: 5,
    createdAt: new Date(),
  },
  {
    id: "slot2",
    date: new Date(),
    boatId: "boat1",
    slotNumber: 2,
    departureTime: "11:00",
    returnTime: "13:30",
    maxDivers: 12,
    currentAssignments: 8,
    createdAt: new Date(),
  },
];

const mockCustomers: Customer[] = [
  {
    id: "1",
    bookingReference: "BK001",
    documentId: "DOC001",
    fullName: "John Doe",
    email: "john@example.com",
    phone: "+1234567890",
    accommodations: "Sea Saba Resort - Room 101",
    certificationLevel: "Open Water",
    nitroxCertified: true,
    equipmentNeeded: {
      bcd: { needed: true, size: "M/L", abbreviation: "BCD-M/L" },
      regulator: { needed: true, size: "M/L", abbreviation: "REG-M/L" },
      mask: { needed: false, abbreviation: "OWN" },
      fins: { needed: false, abbreviation: "OWN" },
      wetsuit: { needed: true, size: "M", abbreviation: "WET-M" },
      computer: { needed: false, abbreviation: "OWN" },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    bookingReference: "BK002",
    documentId: "DOC002",
    fullName: "Jane Smith",
    email: "jane@example.com",
    phone: "+1234567891",
    accommodations: "Sea Saba Resort - Room 102",
    certificationLevel: "Advanced",
    nitroxCertified: false,
    equipmentNeeded: {
      bcd: { needed: true, size: "S", abbreviation: "BCD-S" },
      regulator: { needed: true, size: "S", abbreviation: "REG-S" },
      mask: { needed: true, size: "M", abbreviation: "MASK-M" },
      fins: { needed: true, size: "M", abbreviation: "FINS-M" },
      wetsuit: { needed: true, size: "S", abbreviation: "WET-S" },
      computer: { needed: false, abbreviation: "OWN" },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockAssignments: DiveAssignment[] = [
  { 
    id: "1", 
    customerId: "1", 
    diveSlotId: "slot1", 
    assignedAt: new Date(), 
    assignedBy: "user", 
    tankType: "nitrox", 
    equipmentProvided: {
      bcd: { needed: false, abbreviation: "NONE" },
      regulator: { needed: false, abbreviation: "NONE" },
      mask: { needed: false, abbreviation: "NONE" },
      fins: { needed: false, abbreviation: "NONE" },
      wetsuit: { needed: false, abbreviation: "NONE" }
    } 
  },
  { 
    id: "2", 
    customerId: "2", 
    diveSlotId: "slot2", 
    assignedAt: new Date(), 
    assignedBy: "user", 
    tankType: "air", 
    equipmentProvided: {
      bcd: { needed: false, abbreviation: "NONE" },
      regulator: { needed: false, abbreviation: "NONE" },
      mask: { needed: false, abbreviation: "NONE" },
      fins: { needed: false, abbreviation: "NONE" },
      wetsuit: { needed: false, abbreviation: "NONE" }
    } 
  },
];

export default function TaxiScheduler() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [taxiAssignments, setTaxiAssignments] = useState<TaxiAssignment[]>([]);
  const [selectedTaxi, setSelectedTaxi] = useState<number>(1);
  const toast = useToast();

  // Calculate pickup times based on dive slot departure times
  const calculatePickupTime = (departureTime: string, hotel: string): string => {
    // Different hotels need different pickup times
    const hotelOffsets: { [key: string]: number } = {
      "Sea Saba Resort": 30, // 30 minutes before
      "Other Hotel 1": 45,
      "Other Hotel 2": 60,
    };
    
    const [hours, minutes] = departureTime.split(':').map(Number);
    const offset = hotelOffsets[hotel] || 30;
    
    const pickupMinutes = (hours * 60 + minutes) - offset;
    const pickupHours = Math.floor(pickupMinutes / 60);
    const pickupMins = pickupMinutes % 60;
    
    return `${pickupHours.toString().padStart(2, '0')}:${pickupMins.toString().padStart(2, '0')}`;
  };

  const assignTaxi = (customerId: string, diveSlotId: string, taxiId: 1 | 2) => {
    const customer = mockCustomers.find(c => c.id === customerId);
    const diveSlot = mockDiveSlots.find(s => s.id === diveSlotId);
    const taxi = mockTaxis.find(t => t.id === taxiId);
    
    if (!customer || !diveSlot || !taxi) return;

    // Check if customer already has taxi assignment
    const existingAssignment = taxiAssignments.find(a => a.customerId === customerId);
    if (existingAssignment) {
      toast({
        title: "Already Assigned",
        description: "This customer already has a taxi assignment",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const pickupTime = calculatePickupTime(
      diveSlot.departureTime,
      customer.accommodations || ''
    );
    const pickupLocation = customer.accommodations || 'Unknown Accommodations';
    const destination = `Sea Saba Dock - ${diveSlot.departureTime} departure`;

    const assignment: TaxiAssignment = {
      id: Date.now().toString(),
      customerId,
      diveSlotId,
      taxiId,
      pickupTime,
      pickupLocation,
      destination,
      numberOfPassengers: 1, // Could be extended for group bookings
      scheduledAt: new Date(),
    };

    setTaxiAssignments(prev => [...prev, assignment]);
    toast({
      title: "Taxi Assigned",
      description: `${customer.fullName} assigned to ${taxi.name}`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const removeTaxiAssignment = (assignmentId: string) => {
    setTaxiAssignments(prev => prev.filter(a => a.id !== assignmentId));
    toast({
      title: "Assignment Removed",
      description: "Taxi assignment has been removed",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  const getCustomersNeedingTaxi = () => {
    return mockAssignments.map(assignment => {
      const customer = mockCustomers.find(c => c.id === assignment.customerId);
      const diveSlot = mockDiveSlots.find(s => s.id === assignment.diveSlotId);
      return { customer, diveSlot, assignment };
    }).filter(item => item.customer && item.diveSlot);
  };

  const getAssignmentsByTaxi = (taxiId: number) => {
    return taxiAssignments
      .filter(a => a.taxiId === taxiId)
      .map(assignment => {
        const customer = mockCustomers.find(c => c.id === assignment.customerId);
        const diveSlot = mockDiveSlots.find(s => s.id === assignment.diveSlotId);
        return { assignment, customer, diveSlot };
      })
      .filter(item => item.customer && item.diveSlot)
      .sort((a, b) => a.assignment.pickupTime.localeCompare(b.assignment.pickupTime));
  };

  const autoAssignTaxis = () => {
    const customersNeedingTaxi = getCustomersNeedingTaxi();
    const unassignedCustomers = customersNeedingTaxi.filter(
      item => !taxiAssignments.some(a => a.customerId === item.customer!.id)
    );

    // Simple auto-assignment logic - alternate between taxis
    unassignedCustomers.forEach((item, index) => {
      const taxiId = ((index % 2) + 1) as 1 | 2; // Alternate between taxi 1 and 2
      assignTaxi(item.customer!.id, item.diveSlot!.id, taxiId);
    });
  };

  const customersNeedingTaxi = getCustomersNeedingTaxi();
  const unassignedCount = customersNeedingTaxi.length - taxiAssignments.length;

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Heading size="md">Taxi Scheduler</Heading>
            <Text color="textMuted">
              Schedule taxi pickups for divers based on their dive assignments
            </Text>
            
            <HStack spacing={4}>
              <Box>
                <Text fontWeight="bold" mb={2}>Date</Text>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </Box>
              
              <Button
                leftIcon={<FiTruck />}
                colorScheme="blue"
                onClick={autoAssignTaxis}
                isDisabled={unassignedCount === 0}
              >
                Auto-Assign Taxis ({unassignedCount} remaining)
              </Button>
            </HStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Customers Needing Taxi */}
      {unassignedCount > 0 && (
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md">
                Customers Needing Taxi ({unassignedCount})
              </Heading>
              
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Customer</Th>
                      <Th>Hotel</Th>
                      <Th>Dive Assignment</Th>
                      <Th>Pickup Time</Th>
                      <Th>Assign Taxi</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {customersNeedingTaxi
                      .filter(item => !taxiAssignments.some(a => a.customerId === item.customer!.id))
                      .map((item) => {
                        const { customer, diveSlot } = item;
                        const pickupTime = calculatePickupTime(
                          diveSlot!.departureTime,
                          customer!.accommodations || ''
                        );
                        
                        return (
                          <Tr key={customer!.id}>
                            <Td>
                              <VStack align="start" spacing={0}>
                                <Text fontWeight="bold">{customer!.fullName}</Text>
                                <Text fontSize="xs" color="textMuted">{customer!.bookingReference}</Text>
                              </VStack>
                            </Td>
                            <Td>
                              <VStack align="start" spacing={0}>
                                <Text>{customer!.accommodations || ""}</Text>
                              </VStack>
                            </Td>
                            <Td>
                              <VStack spacing={1}>
                                <Badge colorScheme="blue">Dive {diveSlot!.slotNumber}</Badge>
                                <Text fontSize="xs" color="textMuted">
                                  Departure: {diveSlot!.departureTime}
                                </Text>
                              </VStack>
                            </Td>
                            <Td>
                              <HStack spacing={2}>
                                <FiClock />
                                <Text fontWeight="bold">{pickupTime}</Text>
                              </HStack>
                            </Td>
                            <Td>
                              <HStack spacing={2}>
                                {mockTaxis.map((taxi) => (
                                  <Button
                                    key={taxi.id}
                                    size="sm"
                                    variant="outline"
                                    colorScheme="orange"
                                    onClick={() => assignTaxi(customer!.id, diveSlot!.id, taxi.id)}
                                  >
                                    {taxi.name}
                                  </Button>
                                ))}
                              </HStack>
                            </Td>
                          </Tr>
                        );
                      })}
                  </Tbody>
                </Table>
              </Box>
            </VStack>
          </CardBody>
        </Card>
      )}

      {/* Taxi Assignments */}
      {taxiAssignments.length > 0 && (
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
          {mockTaxis.map((taxi) => {
            const assignments = getAssignmentsByTaxi(taxi.id);
            const currentLoad = assignments.length;
            const capacity = taxi.capacity;
            const isFull = currentLoad >= capacity;
            
            return (
              <Card key={taxi.id} bg={isFull ? "warningBg" : "bgPrimary"} borderWidth={1} borderColor={isFull ? "warningBorder" : "borderColor"}>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                      <Heading size="sm">{taxi.name}</Heading>
                      <Badge colorScheme={isFull ? "orange" : "green"}>
                        {currentLoad}/{capacity} passengers
                      </Badge>
                    </HStack>
                    
                    <Text fontSize="sm" color="textMuted">
                      Driver: {taxi.driverContact}
                    </Text>

                    {assignments.length > 0 ? (
                      <VStack spacing={2} align="stretch">
                        {assignments.map(({ assignment, customer, diveSlot }) => (
                          <Box key={assignment.id} p={3} bg="bgSecondary" borderRadius="md">
                            <HStack justify="space-between" align="start">
                              <VStack align="start" spacing={2} flex={1}>
                                <HStack spacing={2}>
                                  <FiClock color="warning" />
                                  <Text fontWeight="bold">{assignment.pickupTime}</Text>
                                </HStack>
                                
                                <VStack align="start" spacing={1}>
                                  <Text>{customer!.fullName}</Text>
                                  <Text fontSize="xs" color="textMuted">
                                    {customer!.accommodations || ""}
                                  </Text>
                                </VStack>
                                
                                <HStack spacing={2}>
                                  <FiMapPin color="primary" />
                                  <Text fontSize="sm">{assignment.pickupLocation}</Text>
                                </HStack>
                                
                                <Badge colorScheme="blue" size="sm">
                                  Dive {diveSlot!.slotNumber} • {diveSlot!.departureTime}
                                </Badge>
                              </VStack>
                              
                              <IconButton
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                icon={<FiX />}
                                aria-label="Remove taxi assignment"
                                onClick={() => removeTaxiAssignment(assignment.id)}
                              />
                            </HStack>
                          </Box>
                        ))}
                      </VStack>
                    ) : (
                      <Text color="textMuted" textAlign="center" py={4}>
                        No assignments for this taxi
                      </Text>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            );
          })}
        </SimpleGrid>
      )}

      {/* Export Options */}
      {taxiAssignments.length > 0 && (
        <Card>
          <CardBody>
            <HStack justify="space-between">
              <VStack align="start" spacing={1}>
                <Heading size="md">Export Taxi Lists</Heading>
                <Text color="textMuted">
                  Generate taxi schedules for {taxiAssignments.length} passengers on {selectedDate}
                </Text>
              </VStack>
              <Button leftIcon={<FiDownload />} colorScheme="orange">
                Export PDF
              </Button>
            </HStack>
          </CardBody>
        </Card>
      )}

      {/* Success Message */}
      {unassignedCount === 0 && taxiAssignments.length > 0 && (
        <Alert status="success">
          <AlertIcon />
          All customers have been assigned to taxis! You can now export the taxi lists.
        </Alert>
      )}
    </VStack>
  );
}
