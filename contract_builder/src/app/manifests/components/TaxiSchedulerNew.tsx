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
  Switch,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { FiTruck, FiClock, FiMapPin, FiPlus, FiX, FiEdit, FiSave } from "react-icons/fi";
import { 
  DayRow, 
  TaxiRun,
  TaxiAssignmentDerived
} from "@/types/manifestTypes";
import { dayManifestService, taxiUtils } from "@/services/dayManifests";
import { customerService } from "@/services/customers";

interface TaxiSchedulerV2Props {
  selectedDate: string;
}

export default function TaxiSchedulerV2({ selectedDate }: TaxiSchedulerV2Props) {
  const [dayRows, setDayRows] = useState<DayRow[]>([]);
  const [taxiRuns, setTaxiRuns] = useState<TaxiRun[]>([]);
  const [taxiAssignments, setTaxiAssignments] = useState<TaxiAssignmentDerived[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [editingRun, setEditingRun] = useState<TaxiRun | null>(null);
  const [isAddingRun, setIsAddingRun] = useState(false);
  const [newRun, setNewRun] = useState({
    direction: 'to_harbor' as 'to_harbor' | 'from_harbor',
    timeLocal: '',
    label: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  // Load data
  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
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
      console.error('Error loading taxi data:', error);
      toast({
        title: 'Error loading data',
        description: 'Failed to load taxi data',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addTaxiRun = async () => {
    try {
      await dayManifestService.createTaxiRun(selectedDate, newRun);
      setNewRun({ direction: 'to_harbor', timeLocal: '', label: '' });
      setIsAddingRun(false);
      await loadData();
      toast({
        title: 'Taxi run added',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: 'Error adding taxi run',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const updateTaxiRun = async (runId: string, updates: Partial<TaxiRun>) => {
    try {
      await dayManifestService.updateTaxiRun(selectedDate, runId, updates);
      setEditingRun(null);
      await loadData();
      toast({
        title: 'Taxi run updated',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: 'Error updating taxi run',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const deleteTaxiRun = async (runId: string) => {
    try {
      await dayManifestService.deleteTaxiRun(selectedDate, runId);
      await loadData();
      toast({
        title: 'Taxi run deleted',
        status: 'info',
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: 'Error deleting taxi run',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const getAssignmentsForRun = (runTime: string) => {
    return taxiAssignments.filter(a => 
      a.pickupTime === runTime || a.dropoffTime === runTime
    );
  };

  const toHarborRuns = taxiRuns.filter(r => r.direction === 'to_harbor');
  const fromHarborRuns = taxiRuns.filter(r => r.direction === 'from_harbor');

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <Card>
        <CardBody>
          <HStack justify="space-between" align="center">
            <Heading size="md">Taxi Schedule - {selectedDate}</Heading>
            <Button
              leftIcon={<FiPlus />}
              onClick={() => setIsAddingRun(true)}
            >
              Add Run
            </Button>
          </HStack>
        </CardBody>
      </Card>

      {/* Summary */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <Card>
          <CardBody textAlign="center">
            <Text fontSize="2xl" fontWeight="bold">{dayRows.filter(r => r.needsTaxi).length}</Text>
            <Text>Customers Need Taxi</Text>
          </CardBody>
        </Card>
        <Card>
          <CardBody textAlign="center">
            <Text fontSize="2xl" fontWeight="bold">{toHarborRuns.length}</Text>
            <Text>To Harbor Runs</Text>
          </CardBody>
        </Card>
        <Card>
          <CardBody textAlign="center">
            <Text fontSize="2xl" fontWeight="bold">{fromHarborRuns.length}</Text>
            <Text>From Harbor Runs</Text>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* To Harbor Runs */}
      <Card>
        <CardBody>
          <Heading size="sm" mb={4}>To Harbor Runs</Heading>
          <VStack spacing={4} align="stretch">
            {toHarborRuns.map((run) => (
              <Box key={run.id} p={4} border="1px" borderRadius="md">
                <HStack justify="space-between" align="start">
                  <VStack align="start" spacing={2}>
                    <HStack>
                      <FiClock color="blue.500" />
                      <Text fontWeight="bold">{run.timeLocal}</Text>
                      {run.label && <Badge>{run.label}</Badge>}
                      {run.isDefault && <Badge colorScheme="gray">Default</Badge>}
                    </HStack>
                    
                    {editingRun?.id === run.id ? (
                      <HStack spacing={2}>
                        <Input
                          value={editingRun!.timeLocal}
                          onChange={(e) => setEditingRun({ ...editingRun!, timeLocal: e.target.value })}
                          placeholder="Time (e.g., 08:30)"
                          size="sm"
                          w="120px"
                        />
                        <Input
                          value={editingRun!.label || ''}
                          onChange={(e) => setEditingRun({ ...editingRun!, label: e.target.value })}
                          placeholder="Label (optional)"
                          size="sm"
                        />
                        <IconButton
                          aria-label="Save"
                          icon={<FiSave />}
                          size="sm"
                          colorScheme="green"
                          onClick={() => updateTaxiRun(run.id!, editingRun!)}
                        />
                        <IconButton
                          aria-label="Cancel"
                          icon={<FiX />}
                          size="sm"
                          onClick={() => setEditingRun(null)}
                        />
                      </HStack>
                    ) : (
                      <HStack>
                        <IconButton
                          aria-label="Edit"
                          icon={<FiEdit />}
                          size="sm"
                          onClick={() => setEditingRun(run)}
                        />
                        {!run.isDefault && (
                          <IconButton
                            aria-label="Delete"
                            icon={<FiX />}
                            size="sm"
                            colorScheme="red"
                            onClick={() => deleteTaxiRun(run.id!)}
                          />
                        )}
                      </HStack>
                    )}
                  </VStack>

                  <VStack align="end" spacing={1}>
                    <Text fontSize="sm" fontWeight="bold">
                      {getAssignmentsForRun(run.timeLocal).length} passengers
                    </Text>
                  </VStack>
                </HStack>

                {/* Passengers for this run */}
                {getAssignmentsForRun(run.timeLocal).length > 0 && (
                  <Box mt={3}>
                    <Text fontSize="sm" fontWeight="bold" mb={2}>Passengers:</Text>
                    <VStack spacing={1} align="start">
                      {getAssignmentsForRun(run.timeLocal).map((assignment, idx) => (
                        <HStack key={idx} spacing={2}>
                          <Text fontSize="sm">{assignment.customerName}</Text>
                          <FiMapPin fontSize="12px" color="gray.500" />
                          <Text fontSize="xs" color="textMuted">{assignment.pickupLocation}</Text>
                        </HStack>
                      ))}
                    </VStack>
                  </Box>
                )}
              </Box>
            ))}
          </VStack>
        </CardBody>
      </Card>

      {/* From Harbor Runs */}
      <Card>
        <CardBody>
          <Heading size="sm" mb={4}>From Harbor Runs</Heading>
          <VStack spacing={4} align="stretch">
            {fromHarborRuns.map((run) => (
              <Box key={run.id} p={4} border="1px" borderRadius="md">
                <HStack justify="space-between" align="start">
                  <VStack align="start" spacing={2}>
                    <HStack>
                      <FiClock color="orange.500" />
                      <Text fontWeight="bold">{run.timeLocal}</Text>
                      {run.label && <Badge>{run.label}</Badge>}
                      {run.isDefault && <Badge colorScheme="gray">Default</Badge>}
                    </HStack>
                    
                    {editingRun?.id === run.id ? (
                      <HStack spacing={2}>
                        <Input
                          value={editingRun!.timeLocal}
                          onChange={(e) => setEditingRun({ ...editingRun!, timeLocal: e.target.value })}
                          placeholder="Time (e.g., 08:30)"
                          size="sm"
                          w="120px"
                        />
                        <Input
                          value={editingRun!.label || ''}
                          onChange={(e) => setEditingRun({ ...editingRun!, label: e.target.value })}
                          placeholder="Label (optional)"
                          size="sm"
                        />
                        <IconButton
                          aria-label="Save"
                          icon={<FiSave />}
                          size="sm"
                          colorScheme="green"
                          onClick={() => updateTaxiRun(run.id!, editingRun!)}
                        />
                        <IconButton
                          aria-label="Cancel"
                          icon={<FiX />}
                          size="sm"
                          onClick={() => setEditingRun(null)}
                        />
                      </HStack>
                    ) : (
                      <HStack>
                        <IconButton
                          aria-label="Edit"
                          icon={<FiEdit />}
                          size="sm"
                          onClick={() => setEditingRun(run)}
                        />
                        {!run.isDefault && (
                          <IconButton
                            aria-label="Delete"
                            icon={<FiX />}
                            size="sm"
                            colorScheme="red"
                            onClick={() => deleteTaxiRun(run.id!)}
                          />
                        )}
                      </HStack>
                    )}
                  </VStack>

                  <VStack align="end" spacing={1}>
                    <Text fontSize="sm" fontWeight="bold">
                      {getAssignmentsForRun(run.timeLocal).length} passengers
                    </Text>
                  </VStack>
                </HStack>

                {/* Passengers for this run */}
                {getAssignmentsForRun(run.timeLocal).length > 0 && (
                  <Box mt={3}>
                    <Text fontSize="sm" fontWeight="bold" mb={2}>Passengers:</Text>
                    <VStack spacing={1} align="start">
                      {getAssignmentsForRun(run.timeLocal).map((assignment, idx) => (
                        <HStack key={idx} spacing={2}>
                          <Text fontSize="sm">{assignment.customerName}</Text>
                          <FiMapPin fontSize="12px" color="gray.500" />
                          <Text fontSize="xs" color="textMuted">{assignment.dropoffLocation}</Text>
                        </HStack>
                      ))}
                    </VStack>
                  </Box>
                )}
              </Box>
            ))}
          </VStack>
        </CardBody>
      </Card>

      {/* Add Run Modal */}
      <Modal isOpen={isAddingRun} onClose={() => setIsAddingRun(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Taxi Run</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Direction</FormLabel>
                <Select
                  value={newRun.direction}
                  onChange={(e) => setNewRun({ ...newRun, direction: e.target.value as 'to_harbor' | 'from_harbor' })}
                >
                  <option value="to_harbor">To Harbor</option>
                  <option value="from_harbor">From Harbor</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Time</FormLabel>
                <Input
                  value={newRun.timeLocal}
                  onChange={(e) => setNewRun({ ...newRun, timeLocal: e.target.value })}
                  placeholder="e.g., 08:30"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Label (optional)</FormLabel>
                <Input
                  value={newRun.label}
                  onChange={(e) => setNewRun({ ...newRun, label: e.target.value })}
                  placeholder="e.g., Extra run"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setIsAddingRun(false)}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={addTaxiRun}>
              Add Run
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
