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
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { FiCalendar, FiUsers, FiTruck, FiDownload, FiPlus, FiX } from "react-icons/fi";
import { 
  Customer, 
  DiveSlot, 
  DiveAssignment, 
  TankRequirements,
  CrewAssignment
} from "@/types/manifestTypes";
import { Boat } from "@/types/diveLogTypes";
import { CrewMember, CrewRole } from "@/types/crewTypes";
import { crewService } from "@/services/crew";

const ROLE_LABELS: Record<CrewRole, string> = {
  captain: "Captain",
  instructor: "Instructor",
  dive_guide: "Dive Guide",
  surface_support: "Surface Support",
};

// Mock data for demonstration
const mockBoats: Boat[] = [
  { id: "boat1", name: "Sea Saba I", capacity: 12, maxDiveSlots: 4, active: true },
  { id: "boat2", name: "Sea Saba II", capacity: 10, maxDiveSlots: 4, active: true },
];

const mockCustomers: Customer[] = [
  {
    id: "1",
    bookingReference: "BK001",
    documentId: "DOC001",
    fullName: "John Doe",
    email: "john@example.com",
    accommodations: "Sea Saba Resort",
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
    accommodations: "Sea Saba Resort",
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

export default function ManifestBoard() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBoat, setSelectedBoat] = useState<string>(mockBoats[0].id);
  const [diveSlots, setDiveSlots] = useState<DiveSlot[]>([]);
  const [assignments, setAssignments] = useState<DiveAssignment[]>([]);
  const [unassignedCustomers, setUnassignedCustomers] = useState<Customer[]>(mockCustomers);
  const [crew, setCrew] = useState<CrewAssignment>({ assignments: [] });
  const [availableCrew, setAvailableCrew] = useState<CrewMember[]>([]);
  const toast = useToast();

  // Fetch available crew members
  useEffect(() => {
    const fetchCrew = async () => {
      try {
        const crewData = await crewService.getAllCrew();
        setAvailableCrew(crewData);
      } catch (error) {
        console.error('Error fetching crew:', error);
      }
    };
    fetchCrew();
  }, []);

  // Initialize dive slots for selected date and boat
  useEffect(() => {
    const slots: DiveSlot[] = [
      {
        id: `slot1-${selectedDate}-${selectedBoat}`,
        date: new Date(selectedDate),
        boatId: selectedBoat,
        slotNumber: 1,
        departureTime: "08:00",
        returnTime: "10:30",
        maxDivers: 12,
        currentAssignments: 0,
        createdAt: new Date(),
      },
      {
        id: `slot2-${selectedDate}-${selectedBoat}`,
        date: new Date(selectedDate),
        boatId: selectedBoat,
        slotNumber: 2,
        departureTime: "11:00",
        returnTime: "13:30",
        maxDivers: 12,
        currentAssignments: 0,
        createdAt: new Date(),
      },
      {
        id: `slot3-${selectedDate}-${selectedBoat}`,
        date: new Date(selectedDate),
        boatId: selectedBoat,
        slotNumber: 3,
        departureTime: "14:00",
        returnTime: "16:30",
        maxDivers: 12,
        currentAssignments: 0,
        createdAt: new Date(),
      },
      {
        id: `slot4-${selectedDate}-${selectedBoat}`,
        date: new Date(selectedDate),
        boatId: selectedBoat,
        slotNumber: 4,
        departureTime: "17:00",
        returnTime: "19:30",
        maxDivers: 12,
        currentAssignments: 0,
        createdAt: new Date(),
      },
    ];
    setDiveSlots(slots);
  }, [selectedDate, selectedBoat]);

  const assignCustomerToSlot = (customerId: string, slotId: string, tankType: 'air' | 'nitrox') => {
    const customer = unassignedCustomers.find(c => c.id === customerId);
    if (!customer) return;

    const slot = diveSlots.find(s => s.id === slotId);
    if (!slot || slot.currentAssignments >= slot.maxDivers) {
      toast({
        title: "Slot Full",
        description: "This dive slot is already at maximum capacity",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const assignment: DiveAssignment = {
      id: Date.now().toString(),
      customerId,
      diveSlotId: slotId,
      assignedAt: new Date(),
      assignedBy: "current-user", // Would come from auth context
      tankType,
      equipmentProvided: customer.equipmentNeeded,
    };

    setAssignments(prev => [...prev, assignment]);
    setUnassignedCustomers(prev => prev.filter(c => c.id !== customerId));
    setDiveSlots(prev => prev.map(s => 
      s.id === slotId ? { ...s, currentAssignments: s.currentAssignments + 1 } : s
    ));

    toast({
      title: "Customer Assigned",
      description: `${customer.fullName} assigned to dive slot ${slot.slotNumber}`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const removeAssignment = (assignmentId: string) => {
    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    const customer = mockCustomers.find(c => c.id === assignment.customerId);
    if (!customer) return;

    setAssignments(prev => prev.filter(a => a.id !== assignmentId));
    setUnassignedCustomers(prev => [...prev, customer]);
    setDiveSlots(prev => prev.map(s => 
      s.id === assignment.diveSlotId ? { ...s, currentAssignments: s.currentAssignments - 1 } : s
    ));
  };

  const calculateTankRequirements = (): TankRequirements => {
    return assignments.reduce(
      (acc, assignment) => {
        if (assignment.tankType === 'nitrox') {
          acc.nitrox++;
        } else {
          acc.air++;
        }
        acc.total++;
        return acc;
      },
      { air: 0, nitrox: 0, total: 0 }
    );
  };

  const getCustomersForSlot = (slotId: string) => {
    return assignments
      .filter(a => a.diveSlotId === slotId)
      .map(a => mockCustomers.find(c => c.id === a.customerId))
      .filter(Boolean) as Customer[];
  };

  const tankReqs = calculateTankRequirements();
  const selectedBoatData = mockBoats.find(b => b.id === selectedBoat);

  const assignedCrewIds = new Set(crew.assignments.map((a) => a.crewId));

  const getAssignedForRole = (role: CrewRole): string[] => {
    return crew.assignments.filter((a) => a.role === role).map((a) => a.crewId);
  };

  const getAvailableForRole = (role: CrewRole): CrewMember[] => {
    return availableCrew
      .filter((m) => m.active)
      .filter((m) => Array.isArray(m.roles) && m.roles.includes(role));
  };

  const setSingleRole = (role: CrewRole, crewId: string) => {
    setCrew((prev) => {
      const withoutRole = prev.assignments.filter((a) => a.role !== role);
      const withoutThisPerson = withoutRole.filter((a) => a.crewId !== crewId);

      if (!crewId) {
        return { assignments: withoutRole };
      }

      return {
        assignments: [...withoutThisPerson, { crewId, role }],
      };
    });
  };

  const setMultiRole = (role: CrewRole, crewIds: string[]) => {
    setCrew((prev) => {
      const roleIds = new Set(crewIds);
      const withoutRole = prev.assignments.filter((a) => a.role !== role);
      const withoutSelectedPeople = withoutRole.filter((a) => !roleIds.has(a.crewId));
      const nextAssignments = crewIds
        .filter(Boolean)
        .map((crewId) => ({ crewId, role }));

      return {
        assignments: [...withoutSelectedPeople, ...nextAssignments],
      };
    });
  };

  const validateCrew = (): boolean => {
    return getAssignedForRole('captain').length === 1;
  };

  const getAssignedCrewDisplay = () => {
    return crew.assignments
      .map((a) => {
        const member = availableCrew.find((c) => c.id === a.crewId);
        return member ? { member, role: a.role } : null;
      })
      .filter(Boolean) as Array<{ member: CrewMember; role: CrewRole }>;
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* Controls */}
      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Heading size="md">Manifest Configuration</Heading>
            
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <Box>
                <Text fontWeight="bold" mb={2}>Date</Text>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </Box>
              
              <Box>
                <Text fontWeight="bold" mb={2}>Boat</Text>
                <Select value={selectedBoat} onChange={(e) => setSelectedBoat(e.target.value)}>
                  {mockBoats.map(boat => (
                    <option key={boat.id} value={boat.id}>
                      {boat.name} (Capacity: {boat.capacity})
                    </option>
                  ))}
                </Select>
              </Box>

              <Box>
                <Text fontWeight="bold" mb={2}>Tank Requirements</Text>
                <HStack spacing={2}>
                  <Badge colorScheme="blue">Air: {tankReqs.air}</Badge>
                  <Badge colorScheme="green">Nitrox: {tankReqs.nitrox}</Badge>
                  <Badge colorScheme="purple">Total: {tankReqs.total}</Badge>
                </HStack>
              </Box>
            </SimpleGrid>

            {/* Crew Assignment */}
            <Box>
              <Text fontWeight="bold" mb={2}>Crew Assignment</Text>
              <VStack spacing={3} align="stretch">
                {/* Captain Selection */}
                <FormControl isRequired>
                  <FormLabel>Captain (Required)</FormLabel>
                  <Select
                    placeholder="Select captain"
                    value={getAssignedForRole('captain')[0] || ''}
                    onChange={(e) => setSingleRole('captain', e.target.value)}
                  >
                    {getAvailableForRole('captain').map((captain) => (
                      <option
                        key={captain.id}
                        value={captain.id}
                        disabled={assignedCrewIds.has(captain.id) && getAssignedForRole('captain')[0] !== captain.id}
                      >
                        {captain.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Instructor</FormLabel>
                  <Select
                    placeholder="Select instructor"
                    value={getAssignedForRole('instructor')[0] || ''}
                    onChange={(e) => setSingleRole('instructor', e.target.value)}
                  >
                    {getAvailableForRole('instructor').map((member) => (
                      <option
                        key={member.id}
                        value={member.id}
                        disabled={assignedCrewIds.has(member.id) && getAssignedForRole('instructor')[0] !== member.id}
                      >
                        {member.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Dive Guide(s)</FormLabel>
                  <Select
                    value={getAssignedForRole('dive_guide')}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
                      setMultiRole('dive_guide', selected);
                    }}
                    multiple
                    height="120px"
                  >
                    {getAvailableForRole('dive_guide').map((member) => (
                      <option
                        key={member.id}
                        value={member.id}
                        disabled={assignedCrewIds.has(member.id) && !getAssignedForRole('dive_guide').includes(member.id)}
                      >
                        {member.name}
                      </option>
                    ))}
                  </Select>
                  <Text fontSize="sm" color="textMuted" mt={1}>
                    Hold Ctrl/Cmd to select multiple
                  </Text>
                </FormControl>

                <FormControl>
                  <FormLabel>Surface Support</FormLabel>
                  <Select
                    value={getAssignedForRole('surface_support')}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
                      setMultiRole('surface_support', selected);
                    }}
                    multiple
                    height="120px"
                  >
                    {getAvailableForRole('surface_support').map((member) => (
                      <option
                        key={member.id}
                        value={member.id}
                        disabled={assignedCrewIds.has(member.id) && !getAssignedForRole('surface_support').includes(member.id)}
                      >
                        {member.name}
                      </option>
                    ))}
                  </Select>
                  <Text fontSize="sm" color="textMuted" mt={1}>
                    Hold Ctrl/Cmd to select multiple
                  </Text>
                </FormControl>

                {/* Assigned Crew Display */}
                {getAssignedCrewDisplay().length > 0 && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>Assigned Crew:</Text>
                    <VStack align="stretch" spacing={1}>
                      {getAssignedCrewDisplay().map(({ member, role }) => (
                        <HStack key={`${member.id}-${role}`} spacing={2} p={2} bg="bgSecondary" borderRadius="md">
                          <Text flex={1}>
                            {member.name} 
                            <Text as="span" fontSize="sm" color="textMuted" ml={2}>
                              ({ROLE_LABELS[role]})
                            </Text>
                          </Text>
                          {member.email && (
                            <Text fontSize="sm" color="textMuted">{member.email}</Text>
                          )}
                        </HStack>
                      ))}
                    </VStack>
                  </Box>
                )}

                {/* Validation Message */}
                {!validateCrew() && (
                  <Text color="red.500" fontSize="sm">
                    Please assign exactly 1 captain
                  </Text>
                )}
              </VStack>
            </Box>
          </VStack>
        </CardBody>
      </Card>

      {/* Dive Slots Grid */}
      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Heading size="md">Dive Slots - {selectedBoatData?.name}</Heading>
            
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
              {diveSlots.map((slot) => {
                const assignedCustomers = getCustomersForSlot(slot.id);
                const isFull = slot.currentAssignments >= slot.maxDivers;
                
                return (
                  <Card key={slot.id} bg={isFull ? "warningBg" : "bgPrimary"} borderWidth={1} borderColor={isFull ? "warningBorder" : "borderColor"}>
                    <CardBody>
                      <VStack spacing={3} align="stretch">
                        <HStack justify="space-between">
                          <Heading size="sm">Dive {slot.slotNumber}</Heading>
                          <Badge colorScheme={isFull ? "orange" : "green"}>
                            {slot.currentAssignments}/{slot.maxDivers} divers
                          </Badge>
                        </HStack>
                        
                        <HStack spacing={4} fontSize="sm" color="textMuted">
                          <Text>🕐 {slot.departureTime}</Text>
                          <Text>🕑 {slot.returnTime}</Text>
                        </HStack>

                        {assignedCustomers.length > 0 ? (
                          <VStack spacing={2} align="stretch">
                            {assignedCustomers.map((customer) => (
                              <Box key={customer.id} p={2} bg="bgSecondary" borderRadius="md">
                                <HStack justify="space-between">
                                  <VStack align="start" spacing={0}>
                                    <Text fontWeight="bold">{customer.fullName}</Text>
                                    <Text fontSize="xs" color="textMuted">
                                      {customer.bookingReference} • {customer.accommodations}
                                    </Text>
                                  </VStack>
                                  <IconButton
                                    size="xs"
                                    variant="ghost"
                                    colorScheme="red"
                                    icon={<FiX />}
                                    aria-label="Remove assignment"
                                    onClick={() => removeAssignment(assignments.find(a => a.customerId === customer.id && a.diveSlotId === slot.id)?.id || '')}
                                  />
                                </HStack>
                                <HStack spacing={2} mt={2}>
                                  <Badge colorScheme={customer.nitroxCertified ? "green" : "gray"} size="sm">
                                    {customer.nitroxCertified ? "Nitrox" : "Air"}
                                  </Badge>
                                  <Badge colorScheme="blue" size="sm">
                                    {customer.certificationLevel}
                                  </Badge>
                                </HStack>
                              </Box>
                            ))}
                          </VStack>
                        ) : (
                          <Text color="textMuted" textAlign="center" py={4}>
                            No divers assigned
                          </Text>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                );
              })}
            </SimpleGrid>
          </VStack>
        </CardBody>
      </Card>

      {/* Unassigned Customers */}
      {unassignedCustomers.length > 0 && (
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md">Unassigned Customers ({unassignedCustomers.length})</Heading>
              
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Customer</Th>
                      <Th>Hotel</Th>
                      <Th>Certification</Th>
                      <Th>Equipment</Th>
                      <Th>Assign to Slot</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {unassignedCustomers.map((customer) => (
                      <Tr key={customer.id}>
                        <Td>
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="bold">{customer.fullName}</Text>
                            <Text fontSize="xs" color="textMuted">{customer.bookingReference}</Text>
                          </VStack>
                        </Td>
                        <Td>
                          <VStack align="start" spacing={0}>
                            <Text>{customer.accommodations}</Text>
                          </VStack>
                        </Td>
                        <Td>
                          <VStack spacing={1}>
                            <Badge colorScheme="blue">{customer.certificationLevel}</Badge>
                            <Badge colorScheme={customer.nitroxCertified ? "green" : "gray"}>
                              {customer.nitroxCertified ? "Nitrox" : "Air"}
                            </Badge>
                          </VStack>
                        </Td>
                        <Td>
                          <Text fontSize="sm">
                            {Object.entries(customer.equipmentNeeded)
                              .filter(([_, value]) => value)
                              .map(([key]) => key)
                              .join(', ')}
                          </Text>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            {diveSlots.map((slot) => {
                              const isFull = slot.currentAssignments >= slot.maxDivers;
                              return (
                                <Button
                                  key={slot.id}
                                  size="xs"
                                  variant="outline"
                                  colorScheme={customer.nitroxCertified ? "green" : "blue"}
                                  isDisabled={isFull}
                                  onClick={() => assignCustomerToSlot(
                                    customer.id, 
                                    slot.id, 
                                    customer.nitroxCertified ? "nitrox" : "air"
                                  )}
                                >
                                  {slot.slotNumber}
                                </Button>
                              );
                            })}
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </VStack>
          </CardBody>
        </Card>
      )}

      {/* Export Options */}
      {assignments.length > 0 && (
        <Card>
          <CardBody>
            <HStack justify="space-between">
              <VStack align="start" spacing={1}>
                <Heading size="md">Export Manifest</Heading>
                <Text color="textMuted">
                  Generate PDF manifest for {selectedBoatData?.name} on {selectedDate}
                </Text>
              </VStack>
              <Button leftIcon={<FiDownload />} colorScheme="blue">
                Export PDF
              </Button>
            </HStack>
          </CardBody>
        </Card>
      )}
    </VStack>
  );
}
