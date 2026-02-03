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
  Checkbox,
  Switch,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Stack,
  List,
  ListItem,
  useDisclosure,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { FiCalendar, FiUsers, FiTruck, FiDownload, FiPlus, FiX, FiEdit, FiSave, FiClock, FiCheck } from "react-icons/fi";
import { 
  Customer, 
  DayManifest, 
  DayRow, 
  TaxiRun,
  TaxiAssignmentDerived
} from "@/types/manifestTypes";
import { Boat } from "@/types/diveLogTypes";
import { dayManifestService, taxiUtils } from "@/services/dayManifests";
import { customerService } from "@/services/customers";

interface DayManifestEditorProps {
  selectedDate: string;
  boats: Boat[];
}

export default function DayManifestEditor({ selectedDate, boats }: DayManifestEditorProps) {
  const [dayManifest, setDayManifest] = useState<DayManifest | null>(null);
  const [dayRows, setDayRows] = useState<DayRow[]>([]);
  const [taxiRuns, setTaxiRuns] = useState<TaxiRun[]>([]);
  const [taxiAssignments, setTaxiAssignments] = useState<TaxiAssignmentDerived[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<DayRow> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [isAddingCustomers, setIsAddingCustomers] = useState(false);
  const { isOpen: isModalOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Load data
  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load manifest
      const manifest = await dayManifestService.getDayManifest(selectedDate);
      setDayManifest(manifest);

      // Ensure default taxi runs exist
      await dayManifestService.ensureDefaultTaxiRuns(selectedDate);

      // Load rows and taxi runs
      const [rows, runs] = await Promise.all([
        dayManifestService.listDayRows(selectedDate),
        dayManifestService.listTaxiRuns(selectedDate),
      ]);
      
      setDayRows(rows);
      setTaxiRuns(runs);

      // Load customers for names
      const customerData = await customerService.getAllCustomers();
      setCustomers(customerData);

      // Derive taxi assignments
      const customerNames = customerData.reduce((acc, c) => {
        acc[c.id] = c.fullName;
        return acc;
      }, {} as Record<string, string>);
      
      const assignments = await taxiUtils.deriveTaxiAssignments(
        selectedDate,
        rows,
        runs,
        customerNames
      );
      setTaxiAssignments(assignments);
    } catch (error) {
      console.error('Error loading manifest data:', error);
      toast({
        title: 'Error loading data',
        description: 'Failed to load manifest data',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addCustomerToManifest = async (customerId: string) => {
    try {
      const rowId = await dayManifestService.upsertDayRow(selectedDate, {
        customerId,
        d1: false,
        d2: false,
        d3: false,
        nd: false,
        needsTaxi: false,
      });
      
      // Add the new row locally without refreshing
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        const newRow: DayRow = {
          id: rowId,
          customerId,
          stayId: null,
          d1: false,
          d2: false,
          d3: false,
          nd: false,
          d1BoatId: null,
          d2BoatId: null,
          d3BoatId: null,
          needsTaxi: false,
          pickupLocationText: null,
          dropoffLocationText: null,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setDayRows(prev => [...prev, newRow]);
      }
      
      toast({
        title: 'Customer added',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      console.error('Error adding customer to manifest:', error);
      toast({
        title: 'Error adding customer',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const addMultipleCustomers = async () => {
    if (selectedCustomers.size === 0) return;
    
    setIsAddingCustomers(true);
    try {
      const promises = Array.from(selectedCustomers).map(customerId => 
        dayManifestService.upsertDayRow(selectedDate, {
          customerId,
          d1: false,
          d2: false,
          d3: false,
          nd: false,
          needsTaxi: false,
        })
      );
      
      const rowIds = await Promise.all(promises);
      
      // Add the new rows locally
      const newRows: DayRow[] = [];
      Array.from(selectedCustomers).forEach((customerId, index) => {
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
          newRows.push({
            id: rowIds[index],
            customerId,
            stayId: null,
            d1: false,
            d2: false,
            d3: false,
            nd: false,
            d1BoatId: null,
            d2BoatId: null,
            d3BoatId: null,
            needsTaxi: false,
            pickupLocationText: null,
            dropoffLocationText: null,
            notes: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      });
      
      setDayRows(prev => [...prev, ...newRows]);
      setSelectedCustomers(new Set());
      onClose();
      
      toast({
        title: 'Success',
        description: `Added ${selectedCustomers.size} customers to manifest`,
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error adding customers:', error);
      toast({
        title: 'Error adding customers',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsAddingCustomers(false);
    }
  };

  const updateRow = async (rowId: string, updates: Partial<DayRow>) => {
    try {
      // Get the existing row to ensure we have customerId
      const existingRow = dayRows.find(r => r.id === rowId);
      if (!existingRow) {
        throw new Error('Row not found');
      }
      
      await dayManifestService.upsertDayRow(selectedDate, {
        rowId,
        customerId: existingRow.customerId,
        ...updates,
      });
      
      // Update locally
      setDayRows(prev => prev.map(row => 
        row.id === rowId ? { ...row, ...updates } : row
      ));
      setEditingRow(null);
      setEditingData(null);
    } catch (error) {
      toast({
        title: 'Error updating row',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const startEditing = (rowId: string) => {
    const row = dayRows.find(r => r.id === rowId);
    if (row) {
      setEditingRow(rowId);
      setEditingData({
        d1: row.d1,
        d2: row.d2,
        d3: row.d3,
        nd: row.nd,
        d1BoatId: row.d1BoatId,
        d2BoatId: row.d2BoatId,
        d3BoatId: row.d3BoatId,
        needsTaxi: row.needsTaxi,
        pickupLocationText: row.pickupLocationText,
        dropoffLocationText: row.dropoffLocationText,
      });
    }
  };

  const cancelEditing = () => {
    setEditingRow(null);
    setEditingData(null);
  };

  const saveEditing = async () => {
    if (!editingRow || !editingData) return;
    await updateRow(editingRow, editingData);
  };

  const updateEditingData = (field: string, value: any) => {
    if (!editingData) return;
    
    setEditingData(prev => {
      if (!prev) return null;
      
      // If updating boat ID, update all dive boat IDs
      if (field === 'boatId') {
        return {
          ...prev,
          d1BoatId: value,
          d2BoatId: value,
          d3BoatId: value,
        };
      }
      
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const removeRow = async (rowId: string) => {
    try {
      await dayManifestService.deleteDayRow(selectedDate, rowId);
      setDayRows(prev => prev.filter(row => row.id !== rowId));
      toast({
        title: 'Customer removed',
        status: 'info',
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: 'Error removing customer',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const getCustomerById = (customerId: string) => {
    return customers.find(c => c.id === customerId);
  };

  const getBoatName = (boatId: string | null) => {
    if (!boatId) return 'Not assigned';
    const boat = boats.find(b => b.id === boatId);
    return boat ? boat.name : 'Unknown';
  };

  const getAvailableCustomers = () => {
    const customerIdsInManifest = new Set(dayRows.map(row => row.customerId));
    return customers.filter(c => !customerIdsInManifest.has(c.id));
  };

  if (isLoading) {
    return (
      <Box p={4}>
        <Text>Loading...</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <VStack align="start" spacing={0}>
                <Heading size="md">Day Manifest - {selectedDate}</Heading>
                <Text color="textMuted">
                  Status: <Badge colorScheme={dayManifest?.status === 'published' ? 'green' : 'yellow'}>
                    {dayManifest?.status || 'draft'}
                  </Badge>
                </Text>
              </VStack>
              <HStack spacing={2}>
                {dayManifest?.status === 'draft' && (
                  <Button
                    colorScheme="green"
                    onClick={() => dayManifestService.publishDayManifest(selectedDate).then(loadData)}
                  >
                    Publish
                  </Button>
                )}
                {dayManifest?.status === 'published' && (
                  <Button
                    colorScheme="blue"
                    onClick={() => dayManifestService.completeDayManifest(selectedDate).then(loadData)}
                  >
                    Complete
                  </Button>
                )}
              </HStack>
            </HStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Dive Summary */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <Card>
          <CardBody>
            <VStack spacing={2}>
              <Heading size="sm">Morning Dives</Heading>
              <Text fontSize="2xl" fontWeight="bold">
                {dayRows.filter(r => r.d1 || r.d2).length}
              </Text>
              <Text fontSize="sm" color="textMuted">Divers</Text>
            </VStack>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <VStack spacing={2}>
              <Heading size="sm">Afternoon Dives</Heading>
              <Text fontSize="2xl" fontWeight="bold">
                {dayRows.filter(r => r.d3).length}
              </Text>
              <Text fontSize="sm" color="textMuted">Divers</Text>
            </VStack>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <VStack spacing={2}>
              <Heading size="sm">Nitrox Divers</Heading>
              <Text fontSize="2xl" fontWeight="bold">
                {dayRows.filter(r => r.nd).length}
              </Text>
              <Text fontSize="sm" color="textMuted">Divers</Text>
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Customer Assignments */}
      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <Heading size="sm">Customer Assignments</Heading>
              <Button
                leftIcon={<FiPlus />}
                onClick={onOpen}
                colorScheme="blue"
              >
                Add Customers
              </Button>
            </HStack>

            <Box overflowX="auto">
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th minW="250px">Customer</Th>
                    <Th>Dive Plan</Th>
                    <Th>Boat</Th>
                    <Th minW="200px">Taxi</Th>
                    <Th w="100px">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {dayRows.map(row => {
                    const customer = getCustomerById(row.customerId);
                    if (!customer) return null;
                    
                    return (
                      <Tr key={row.id}>
                        <Td>
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="medium">{customer.fullName}</Text>
                            <Text fontSize="xs" color="textMuted">{customer.emailLower}</Text>
                            {customer.accommodations && (
                              <Text fontSize="xs" color="info">📍 {customer.accommodations}</Text>
                            )}
                          </VStack>
                        </Td>
                        <Td>
                          {editingRow === row.id ? (
                            <Card size="sm" variant="outline" bg="cardBgAlt">
                              <CardBody p={3}>
                                <VStack spacing={3} align="stretch">
                                  <Text fontWeight="medium" fontSize="sm">Dive Plan</Text>
                                  <HStack spacing={4}>
                                    <Checkbox
                                      isChecked={editingData?.d1 || false}
                                      onChange={(e) => updateEditingData('d1', e.target.checked)}
                                      size="sm"
                                    >
                                      D1
                                    </Checkbox>
                                    <Checkbox
                                      isChecked={editingData?.d2 || false}
                                      onChange={(e) => updateEditingData('d2', e.target.checked)}
                                      size="sm"
                                    >
                                      D2
                                    </Checkbox>
                                    <Checkbox
                                      isChecked={editingData?.d3 || false}
                                      onChange={(e) => updateEditingData('d3', e.target.checked)}
                                      size="sm"
                                    >
                                      D3
                                    </Checkbox>
                                    <Checkbox
                                      isChecked={editingData?.nd || false}
                                      onChange={(e) => updateEditingData('nd', e.target.checked)}
                                      size="sm"
                                      colorScheme="purple"
                                    >
                                      Nitrox
                                    </Checkbox>
                                  </HStack>
                                </VStack>
                              </CardBody>
                            </Card>
                          ) : (
                            <VStack spacing={1}>
                              {row.d1 && <Badge size="sm">D1</Badge>}
                              {row.d2 && <Badge size="sm">D2</Badge>}
                              {row.d3 && <Badge size="sm">D3</Badge>}
                              {row.nd && <Badge colorScheme="purple" size="sm">Nitrox</Badge>}
                            </VStack>
                          )}
                        </Td>
                        <Td>
                          {editingRow === row.id ? (
                            <FormControl>
                              <FormLabel fontSize="xs" mb={1}>Boat Assignment</FormLabel>
                              <Select
                                value={editingData?.d1BoatId || ''}
                                onChange={(e) => updateEditingData('boatId', e.target.value || null)}
                                size="sm"
                                bg="cardBg"
                              >
                                <option value="">Select boat</option>
                                {boats.map(boat => (
                                  <option key={boat.id} value={boat.id}>{boat.name}</option>
                                ))}
                              </Select>
                            </FormControl>
                          ) : (
                            <VStack spacing={1} align="start">
                              {(row.d1 || row.d2) && (
                                <Text fontSize="sm">
                                  {row.d1 && row.d2 ? 'Morning' : row.d1 ? 'D1' : 'D2'}: {getBoatName(row.d1BoatId)}
                                </Text>
                              )}
                              {row.d3 && (
                                <Text fontSize="sm">
                                  D3: {getBoatName(row.d3BoatId)}
                                </Text>
                              )}
                              {!row.d1 && !row.d2 && !row.d3 && (
                                <Text fontSize="sm" color="textMuted">No dives</Text>
                              )}
                            </VStack>
                          )}
                        </Td>
                        <Td>
                          {editingRow === row.id ? (
                            <Card size="sm" variant="outline" bg="cardBgAlt">
                              <CardBody p={3}>
                                <VStack spacing={3} align="stretch">
                                  <FormControl>
                                    <FormLabel fontSize="xs" mb={1}>Taxi Required</FormLabel>
                                    <Switch
                                      isChecked={editingData?.needsTaxi || false}
                                      onChange={(e) => updateEditingData('needsTaxi', e.target.checked)}
                                      size="sm"
                                    />
                                  </FormControl>
                                  {editingData?.needsTaxi && (
                                    <>
                                      <FormControl>
                                        <FormLabel fontSize="xs" mb={1}>Pickup Location</FormLabel>
                                        <Input
                                          placeholder="Pickup location"
                                          value={editingData.pickupLocationText || ''}
                                          onChange={(e) => updateEditingData('pickupLocationText', e.target.value)}
                                          size="sm"
                                          bg="cardBg"
                                        />
                                      </FormControl>
                                      <FormControl>
                                        <FormLabel fontSize="xs" mb={1}>Dropoff Location</FormLabel>
                                        <Input
                                          placeholder="Dropoff location"
                                          value={editingData.dropoffLocationText || ''}
                                          onChange={(e) => updateEditingData('dropoffLocationText', e.target.value)}
                                          size="sm"
                                          bg="cardBg"
                                        />
                                      </FormControl>
                                    </>
                                  )}
                                </VStack>
                              </CardBody>
                            </Card>
                          ) : (
                            <VStack spacing={1}>
                              {row.needsTaxi ? (
                                <>
                                  <Badge colorScheme="orange">Needs Taxi</Badge>
                                  {row.pickupLocationText && (
                                    <Text fontSize="xs">From: {row.pickupLocationText}</Text>
                                  )}
                                </>
                              ) : (
                                <Text color="textMuted">No taxi</Text>
                              )}
                            </VStack>
                          )}
                        </Td>
                        <Td>
                          <HStack spacing={1}>
                            {editingRow === row.id ? (
                              <>
                                <IconButton
                                  aria-label="Save"
                                  icon={<FiSave />}
                                  size="xs"
                                  colorScheme="green"
                                  onClick={saveEditing}
                                  title="Save changes"
                                />
                                <IconButton
                                  aria-label="Cancel"
                                  icon={<FiX />}
                                  size="xs"
                                  onClick={cancelEditing}
                                  title="Cancel editing"
                                />
                              </>
                            ) : (
                              <>
                                <IconButton
                                  aria-label="Edit"
                                  icon={<FiEdit />}
                                  size="xs"
                                  onClick={() => startEditing(row.id!)}
                                  title="Edit customer assignment"
                                />
                                <IconButton
                                  aria-label="Remove"
                                  icon={<FiX />}
                                  size="xs"
                                  colorScheme="red"
                                  onClick={() => removeRow(row.id!)}
                                  title="Remove from manifest"
                                />
                              </>
                            )}
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

      {/* Add Customers Modal */}
      <Modal isOpen={isModalOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Customers to Manifest</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text>Select customers to add to the manifest:</Text>
              
              <Box maxH="400px" overflowY="auto" borderWidth={1} borderRadius="md">
                <List spacing={2} p={4}>
                  {getAvailableCustomers().map(customer => (
                    <ListItem key={customer.id} p={2} borderWidth={1} borderRadius="md">
                      <HStack justify="space-between">
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="medium">{customer.fullName}</Text>
                          <Text fontSize="sm" color="textMuted">{customer.emailLower}</Text>
                          {customer.accommodations && (
                            <Text fontSize="xs" color="info">📍 {customer.accommodations}</Text>
                          )}
                          {customer.certLevel && (
                            <Badge size="sm">{customer.certLevel}</Badge>
                          )}
                        </VStack>
                        <Checkbox
                          isChecked={selectedCustomers.has(customer.id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedCustomers);
                            if (e.target.checked) {
                              newSelected.add(customer.id);
                            } else {
                              newSelected.delete(customer.id);
                            }
                            setSelectedCustomers(newSelected);
                          }}
                        />
                      </HStack>
                    </ListItem>
                  ))}
                </List>
              </Box>
              
                  {selectedCustomers.size > 0 && (
                    <Text color="info">
                      {selectedCustomers.size} customer{selectedCustomers.size > 1 ? 's' : ''} selected
                    </Text>
                  )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={addMultipleCustomers}
              isLoading={isAddingCustomers}
              isDisabled={selectedCustomers.size === 0}
            >
              Add {selectedCustomers.size} Customer{selectedCustomers.size !== 1 ? 's' : ''}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
