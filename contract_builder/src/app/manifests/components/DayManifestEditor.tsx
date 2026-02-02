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
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { FiCalendar, FiUsers, FiTruck, FiDownload, FiPlus, FiX, FiEdit, FiSave, FiClock } from "react-icons/fi";
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
  const [isLoading, setIsLoading] = useState(true);
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
      
      await loadData();
      toast({
        title: 'Customer added',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: 'Error adding customer',
        status: 'error',
        duration: 3000,
      });
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
      
      await loadData();
      setEditingRow(null);
    } catch (error) {
      toast({
        title: 'Error updating row',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const removeRow = async (rowId: string) => {
    try {
      await dayManifestService.deleteDayRow(selectedDate, rowId);
      await loadData();
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

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.fullName || 'Unknown';
  };

  const getBoatName = (boatId: string | null) => {
    if (!boatId) return 'None';
    const boat = boats.find(b => b.id === boatId);
    return boat?.name || 'Unknown';
  };

  const getDiveCount = () => {
    return dayRows.reduce((acc, row) => {
      if (row.d1) acc.d1++;
      if (row.d2) acc.d2++;
      if (row.d3) acc.d3++;
      if (row.nd) acc.nd++;
      return acc;
    }, { d1: 0, d2: 0, d3: 0, nd: 0 });
  };

  const diveCounts = getDiveCount();

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <Card>
        <CardBody>
          <HStack justify="space-between" align="center">
            <VStack align="start" spacing={0}>
              <Heading size="md">Day Manifest - {selectedDate}</Heading>
              <Text color="textMuted">
                Status: <Badge colorScheme={
                  dayManifest?.status === 'published' ? 'green' :
                  dayManifest?.status === 'completed' ? 'blue' : 'gray'
                }>{dayManifest?.status || 'draft'}</Badge>
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
        </CardBody>
      </Card>

      {/* Dive Summary */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
        <Card>
          <CardBody textAlign="center">
            <Text fontSize="2xl" fontWeight="bold">{diveCounts.d1}</Text>
            <Text>Dive 1</Text>
          </CardBody>
        </Card>
        <Card>
          <CardBody textAlign="center">
            <Text fontSize="2xl" fontWeight="bold">{diveCounts.d2}</Text>
            <Text>Dive 2</Text>
          </CardBody>
        </Card>
        <Card>
          <CardBody textAlign="center">
            <Text fontSize="2xl" fontWeight="bold">{diveCounts.d3}</Text>
            <Text>Dive 3</Text>
          </CardBody>
        </Card>
        <Card>
          <CardBody textAlign="center">
            <Text fontSize="2xl" fontWeight="bold">{diveCounts.nd}</Text>
            <Text>Night Dive</Text>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Customer Rows */}
      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <Heading size="sm">Customer Assignments</Heading>
              <AddCustomerButton customers={customers} onAdd={addCustomerToManifest} />
            </HStack>

            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Customer</Th>
                  <Th>Dive Plan</Th>
                  <Th>Boat Assignments</Th>
                  <Th>Taxi</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {dayRows.map((row) => (
                  <Tr key={row.id}>
                    <Td>
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="bold">{getCustomerName(row.customerId)}</Text>
                        <Text fontSize="xs" color="textMuted">ID: {row.customerId}</Text>
                      </VStack>
                    </Td>
                    <Td>
                      {editingRow === row.id ? (
                        <VStack spacing={1}>
                          <Checkbox
                            isChecked={row.d1}
                            onChange={(e) => updateRow(row.id!, { d1: e.target.checked })}
                          >
                            Dive 1
                          </Checkbox>
                          <Checkbox
                            isChecked={row.d2}
                            onChange={(e) => updateRow(row.id!, { d2: e.target.checked })}
                          >
                            Dive 2
                          </Checkbox>
                          <Checkbox
                            isChecked={row.d3}
                            onChange={(e) => updateRow(row.id!, { d3: e.target.checked })}
                          >
                            Dive 3
                          </Checkbox>
                          <Checkbox
                            isChecked={row.nd}
                            onChange={(e) => updateRow(row.id!, { nd: e.target.checked })}
                          >
                            Night Dive
                          </Checkbox>
                        </VStack>
                      ) : (
                        <VStack spacing={1}>
                          {row.d1 && <Badge>Dive 1</Badge>}
                          {row.d2 && <Badge>Dive 2</Badge>}
                          {row.d3 && <Badge>Dive 3</Badge>}
                          {row.nd && <Badge colorScheme="purple">Night Dive</Badge>}
                        </VStack>
                      )}
                    </Td>
                    <Td>
                      {editingRow === row.id ? (
                        <VStack spacing={1}>
                          {row.d1 && (
                            <Select
                              value={row.d1BoatId || ''}
                              onChange={(e) => updateRow(row.id!, { d1BoatId: e.target.value || null })}
                              size="sm"
                            >
                              <option value="">No boat</option>
                              {boats.map(boat => (
                                <option key={boat.id} value={boat.id}>{boat.name}</option>
                              ))}
                            </Select>
                          )}
                          {row.d2 && (
                            <Select
                              value={row.d2BoatId || ''}
                              onChange={(e) => updateRow(row.id!, { d2BoatId: e.target.value || null })}
                              size="sm"
                            >
                              <option value="">No boat</option>
                              {boats.map(boat => (
                                <option key={boat.id} value={boat.id}>{boat.name}</option>
                              ))}
                            </Select>
                          )}
                          {row.d3 && (
                            <Select
                              value={row.d3BoatId || ''}
                              onChange={(e) => updateRow(row.id!, { d3BoatId: e.target.value || null })}
                              size="sm"
                            >
                              <option value="">No boat</option>
                              {boats.map(boat => (
                                <option key={boat.id} value={boat.id}>{boat.name}</option>
                              ))}
                            </Select>
                          )}
                        </VStack>
                      ) : (
                        <VStack spacing={1}>
                          {row.d1 && row.d1BoatId && <Text fontSize="sm">D1: {getBoatName(row.d1BoatId)}</Text>}
                          {row.d2 && row.d2BoatId && <Text fontSize="sm">D2: {getBoatName(row.d2BoatId)}</Text>}
                          {row.d3 && row.d3BoatId && <Text fontSize="sm">D3: {getBoatName(row.d3BoatId)}</Text>}
                        </VStack>
                      )}
                    </Td>
                    <Td>
                      {editingRow === row.id ? (
                        <VStack spacing={2}>
                          <Switch
                            isChecked={row.needsTaxi}
                            onChange={(e) => updateRow(row.id!, { needsTaxi: e.target.checked })}
                          >
                            Needs Taxi
                          </Switch>
                          {row.needsTaxi && (
                            <>
                              <Input
                                placeholder="Pickup location"
                                value={row.pickupLocationText || ''}
                                onChange={(e) => updateRow(row.id!, { pickupLocationText: e.target.value })}
                                size="sm"
                              />
                              <Input
                                placeholder="Dropoff location"
                                value={row.dropoffLocationText || ''}
                                onChange={(e) => updateRow(row.id!, { dropoffLocationText: e.target.value })}
                                size="sm"
                              />
                            </>
                          )}
                        </VStack>
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
                      <HStack spacing={2}>
                        {editingRow === row.id ? (
                          <>
                            <IconButton
                              aria-label="Save"
                              icon={<FiSave />}
                              size="sm"
                              colorScheme="green"
                              onClick={() => setEditingRow(null)}
                            />
                            <IconButton
                              aria-label="Cancel"
                              icon={<FiX />}
                              size="sm"
                              onClick={() => setEditingRow(null)}
                            />
                          </>
                        ) : (
                          <>
                            <IconButton
                              aria-label="Edit"
                              icon={<FiEdit />}
                              size="sm"
                              onClick={() => setEditingRow(row.id!)}
                            />
                            <IconButton
                              aria-label="Remove"
                              icon={<FiX />}
                              size="sm"
                              colorScheme="red"
                              onClick={() => removeRow(row.id!)}
                            />
                          </>
                        )}
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
}

interface AddCustomerButtonProps {
  customers: Customer[];
  onAdd: (customerId: string) => void;
}

function AddCustomerButton({ customers, onAdd }: AddCustomerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Filter out customers already in the manifest (this would need to be passed in)
  const availableCustomers = customers; // TODO: Filter out already added customers

  return (
    <Box position="relative">
      <Button
        leftIcon={<FiPlus />}
        onClick={() => setIsOpen(!isOpen)}
      >
        Add Customer
      </Button>
      
      {isOpen && (
        <Card
          position="absolute"
          top="100%"
          right={0}
          mt={2}
          zIndex={10}
          minW="300px"
          maxH="300px"
          overflowY="auto"
        >
          <CardBody p={2}>
            <VStack spacing={1} align="stretch">
              {availableCustomers.map(customer => (
                <Button
                  key={customer.id}
                  variant="ghost"
                  justifyContent="start"
                  onClick={() => {
                    onAdd(customer.id);
                    setIsOpen(false);
                  }}
                >
                  <VStack align="start" spacing={0}>
                    <Text>{customer.fullName}</Text>
                    <Text fontSize="xs" color="textMuted">{customer.emailLower}</Text>
                  </VStack>
                </Button>
              ))}
            </VStack>
          </CardBody>
        </Card>
      )}
    </Box>
  );
}
