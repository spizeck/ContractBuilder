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
  TaxiAssignment
} from "@/types/manifestTypes";
import { Taxi } from "@/types/taxiTypes";
import { taxiService } from "@/services/taxis";

const mockDiveSlots: DiveSlot[] = [
  {
    id: "slot1",
    date: new Date(),
    boatId: "boat1",
    slotNumber: 1,
    departureTime: "09:00",
    returnTime: "11:30",
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
  {
    id: "slot3",
    date: new Date(),
    boatId: "boat1",
    slotNumber: 3,
    departureTime: "13:00",
    returnTime: "15:30",
    maxDivers: 12,
    currentAssignments: 0,
    createdAt: new Date(),
  },
  {
    id: "slot4",
    date: new Date(),
    boatId: "boat1",
    slotNumber: 4,
    departureTime: "18:00",
    returnTime: "20:30",
    maxDivers: 12,
    currentAssignments: 0,
    createdAt: new Date(),
  },
];

const mockCustomers: Customer[] = [
  {
    id: "1",
    fullName: "John Doe",
    emailLower: "john@example.com",
    phoneE164: "+1234567890",
    dob: null,
    notesGeneral: null,
    certLevel: "Open Water",
    certAgencyNumber: "PADI-123456",
    certVerified: false,
    certVerifiedAt: null,
    certVerifiedBy: null,
    nitroxCertified: true,
    nitroxCertAgencyNumber: "PADI-NITROX-123",
    nitroxVerified: false,
    nitroxVerifiedAt: null,
    nitroxVerifiedBy: null,
    lastDiveDate: "2024-01-15",
    lifetimeDives: 50,
    lastDiveDateSourceAt: null,
    gearDefault: {
      bcd: { needRental: true, sizeText: "M/L", sourceText: "Rental BCD M/L" },
      regulator: { needRental: true, sizeText: "M/L", sourceText: "Rental Regulator M/L" },
      mask: { needRental: false, sourceText: "Own mask" },
      fins: { needRental: false, sourceText: "Own fins" },
      wetsuit: { needRental: true, sizeText: "M", sourceText: "Rental Wetsuit M" },
      computer: { needRental: false, sourceText: "Own computer" },
    },
    gearLastUpdatedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    fullName: "Jane Smith",
    emailLower: "jane@example.com",
    phoneE164: "+1234567891",
    dob: null,
    notesGeneral: null,
    certLevel: "Advanced",
    certAgencyNumber: "PADI-789012",
    certVerified: false,
    certVerifiedAt: null,
    certVerifiedBy: null,
    nitroxCertified: false,
    nitroxCertAgencyNumber: null,
    nitroxVerified: false,
    nitroxVerifiedAt: null,
    nitroxVerifiedBy: null,
    lastDiveDate: "2024-01-10",
    lifetimeDives: 75,
    lastDiveDateSourceAt: null,
    gearDefault: {
      bcd: { needRental: true, sizeText: "S", sourceText: "Rental BCD S" },
      regulator: { needRental: true, sizeText: "S", sourceText: "Rental Regulator S" },
      mask: { needRental: true, sizeText: "M", sourceText: "Rental Mask M" },
      fins: { needRental: true, sizeText: "M", sourceText: "Rental Fins M" },
      wetsuit: { needRental: true, sizeText: "S", sourceText: "Rental Wetsuit S" },
      computer: { needRental: true, sizeText: "S", sourceText: "Rental Computer S" },
    },
    gearLastUpdatedAt: null,
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
      wetsuit: { needed: false, abbreviation: "NONE" },
      computer: { needed: false, abbreviation: "NONE" }
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
      wetsuit: { needed: false, abbreviation: "NONE" },
      computer: { needed: false, abbreviation: "NONE" }
    } 
  },
];

export default function TaxiScheduler() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [taxiAssignments, setTaxiAssignments] = useState<TaxiAssignment[]>([]);
  const [taxis, setTaxis] = useState<Taxi[]>([]);
  const toast = useToast();

  useEffect(() => {
    const fetchTaxis = async () => {
      try {
        const data = await taxiService.getAllTaxis();
        setTaxis(data);
      } catch (error) {
        console.error('Error fetching taxis:', error);
        toast({
          title: 'Error loading taxis',
          description: 'Failed to fetch taxis',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };
    fetchTaxis();
  }, [toast]);

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

  const assignTaxi = (customerId: string, diveSlotId: string, taxiId: string) => {
    const customer = mockCustomers.find(c => c.id === customerId);
    const diveSlot = mockDiveSlots.find(s => s.id === diveSlotId);
    const taxi = taxis.find(t => t.id === taxiId);
    
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
      'Sea Saba Resort' // Default since accommodations is no longer in Customer
    );
    const pickupLocation = 'Sea Saba Resort'; // Default
    const destination = `Sea Saba Dock - ${diveSlot.departureTime} departure`;

    const assignment: TaxiAssignment = {
      id: Date.now().toString(),
      customerId,
      taxiId,
      pickupTime,
      pickupLocation,
      dropoffTime: diveSlot.returnTime,
      dropoffLocation: `Sea Saba Dock - ${diveSlot.departureTime} departure`,
      assignedAt: new Date(),
      assignedBy: "current-user",
      notes: `Dive slot ${diveSlot.slotNumber}`,
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

  const getAssignmentsByTaxi = (taxiId: string) => {
    return taxiAssignments
      .filter(a => a.taxiId === taxiId)
      .map(assignment => {
        const customer = mockCustomers.find(c => c.id === assignment.customerId);
        // Find dive slot based on assignment notes or pickup time
        const diveSlot = mockDiveSlots.find(s => 
          assignment.notes?.includes(`Dive slot ${s.slotNumber}`) ||
          s.departureTime === assignment.pickupTime
        );
        return { assignment, customer, diveSlot };
      })
      .filter(item => item.customer)
      .sort((a, b) => a.assignment.pickupTime.localeCompare(b.assignment.pickupTime));
  };

  const autoAssignTaxis = () => {
    const customersNeedingTaxi = getCustomersNeedingTaxi();
    const unassignedCustomers = customersNeedingTaxi.filter(
      item => !taxiAssignments.some(a => a.customerId === item.customer!.id)
    );

    // Auto-assignment logic:
    // - sort taxis by priority (lower number = preferred)
    // - then by current load
    // - respect capacity
    const activeTaxis = taxis.filter((t) => t.active);
    if (activeTaxis.length === 0) {
      toast({
        title: 'No active taxis',
        description: 'Add/activate taxis in Operations → Manage Taxis first',
        status: 'warning',
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    unassignedCustomers.forEach((item) => {
      const taxiByLoad = activeTaxis
        .map((t) => ({
          taxi: t,
          priority: t.priority ?? 100,
          load: taxiAssignments.filter((a) => a.taxiId === t.id).length,
        }))
        .filter((x) => x.load < x.taxi.capacity)
        .sort((a, b) => (a.priority - b.priority) || (a.load - b.load));

      const chosen = taxiByLoad[0]?.taxi;
      if (!chosen) return;

      assignTaxi(item.customer!.id, item.diveSlot!.id, chosen.id);
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
                          'Sea Saba Resort' // Default
                        );
                        
                        return (
                          <Tr key={customer!.id}>
                            <Td>
                              <VStack align="start" spacing={0}>
                                <Text fontWeight="bold">{customer!.fullName}</Text>
                                <Text fontSize="xs" color="textMuted">{customer!.emailLower}</Text>
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
                                {taxis.filter((t) => t.active).map((taxi) => (
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
          {taxis.filter((t) => t.active).map((taxi) => {
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
                                    {customer!.emailLower}
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
