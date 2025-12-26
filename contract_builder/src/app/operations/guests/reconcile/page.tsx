"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Card,
  CardBody,
  SimpleGrid,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Alert,
  AlertIcon,
  Progress,
  FormControl,
  FormLabel,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  IconButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Flex,
  Spacer,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from "@chakra-ui/react";
import { FiSearch, FiFilter, FiRefreshCw, FiEye, FiEdit, FiCheck, FiX, FiAlertTriangle } from "react-icons/fi";
import { getAllGuests, updateGuest } from "@/services/guests";
import type { Guest, GuestFilter } from "@/types/guestTypes";
import ProtectedPage from "@/components/shared/LayoutComponents/ProtectedPage";

export default function GuestReconciliationPage() {
  const router = useRouter();
  const toast = useToast();
  
  // State
  const [guests, setGuests] = useState<Guest[]>([]);
  const [filteredGuests, setFilteredGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Guest['matchStatus'] | ''>('');
  const [sourceFilter, setSourceFilter] = useState<Guest['source'] | ''>('');
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    matched: 0,
    unmatched: 0,
    duplicates: 0,
    needsReview: 0,
  });

  // Load guests
  useEffect(() => {
    loadGuests();
  }, []);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [guests, searchTerm, statusFilter, sourceFilter]);

  const loadGuests = async () => {
    setLoading(true);
    try {
      const result = await getAllGuests({}, 1000); // Load more for reconciliation
      setGuests(result.guests);
      
      // Calculate stats
      const newStats = {
        total: result.guests.length,
        matched: result.guests.filter(g => g.matchStatus === 'matched').length,
        unmatched: result.guests.filter(g => g.matchStatus === 'unmatched').length,
        duplicates: result.guests.filter(g => g.matchStatus === 'duplicate').length,
        needsReview: result.guests.filter(g => g.matchStatus === 'needs_review').length,
      };
      setStats(newStats);
    } catch (error) {
      console.error('Error loading guests:', error);
      toast({
        title: "Error loading guests",
        status: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...guests];
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(guest => 
        guest.fullName.toLowerCase().includes(term) ||
        guest.email?.toLowerCase().includes(term) ||
        guest.phone?.includes(term) ||
        guest.bookingId?.toString().includes(term) ||
        guest.accommodations?.toLowerCase().includes(term)
      );
    }
    
    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(guest => guest.matchStatus === statusFilter);
    }
    
    // Source filter
    if (sourceFilter) {
      filtered = filtered.filter(guest => guest.source === sourceFilter);
    }
    
    setFilteredGuests(filtered);
  };

  const handleStatusUpdate = async (guestId: string, newStatus: Guest['matchStatus']) => {
    try {
      await updateGuest(guestId, { matchStatus: newStatus });
      
      // Update local state
      setGuests(prev => prev.map(g => 
        g.id === guestId ? { ...g, matchStatus: newStatus } : g
      ));
      
      toast({
        title: "Status updated",
        description: `Guest status changed to ${newStatus?.replace('_', ' ') || 'updated'}`,
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error updating status",
        status: "error",
        duration: 3000,
      });
    }
  };

  const getStatusColor = (status?: Guest['matchStatus']) => {
    switch (status) {
      case "matched": return "green";
      case "unmatched": return "red";
      case "duplicate": return "orange";
      case "needs_review": return "yellow";
      default: return "gray";
    }
  };

  const getSourceColor = (source: Guest['source']) => {
    switch (source) {
      case "waiver_import": return "blue";
      case "manual": return "purple";
      case "checkfront": return "teal";
      default: return "gray";
    }
  };

  const getCompletionPercentage = () => {
    if (stats.total === 0) return 0;
    return Math.round(((stats.matched + stats.duplicates) / stats.total) * 100);
  };

  return (
    <ProtectedPage allowedRoles={['admin', 'hotel-manager', 'hotel-staff']}>
      <Box p={6} maxW="full">
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Box>
            <Heading size="lg" mb={2}>
              Guest Reconciliation Dashboard
            </Heading>
            <Text color="textMuted">
              Review and match guest data from various sources
            </Text>
          </Box>

          {/* Stats Cards */}
          <SimpleGrid columns={{ base: 2, lg: 5 }} spacing={4}>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Total Guests</StatLabel>
                  <StatNumber>{stats.total}</StatNumber>
                  <StatHelpText>All imported guests</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Matched</StatLabel>
                  <StatNumber color="green.500">{stats.matched}</StatNumber>
                  <StatHelpText>Successfully matched</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Duplicates</StatLabel>
                  <StatNumber color="orange.500">{stats.duplicates}</StatNumber>
                  <StatHelpText>Potential duplicates</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Needs Review</StatLabel>
                  <StatNumber color="yellow.500">{stats.needsReview}</StatNumber>
                  <StatHelpText>Requires attention</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Unmatched</StatLabel>
                  <StatNumber color="red.500">{stats.unmatched}</StatNumber>
                  <StatHelpText>No match found</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Progress Bar */}
          <Card>
            <CardBody>
              <VStack spacing={2} align="stretch">
                <HStack justify="space-between">
                  <Text fontWeight="bold">Reconciliation Progress</Text>
                  <Text>{getCompletionPercentage()}%</Text>
                </HStack>
                <Progress 
                  value={getCompletionPercentage()} 
                  colorScheme="green" 
                  size="lg"
                />
                <Text fontSize="sm" color="textMuted">
                  {stats.matched + stats.duplicates} of {stats.total} guests processed
                </Text>
              </VStack>
            </CardBody>
          </Card>

          {/* Filters */}
          <Card>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading size="sm">Filters</Heading>
                
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <FormControl>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <FiSearch color="gray.400" />
                      </InputLeftElement>
                      <Input
                        placeholder="Search guests..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </InputGroup>
                  </FormControl>
                  
                  <FormControl>
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      placeholder="Filter by status"
                    >
                      <option value="">All Statuses</option>
                      <option value="matched">Matched</option>
                      <option value="unmatched">Unmatched</option>
                      <option value="duplicate">Duplicate</option>
                      <option value="needs_review">Needs Review</option>
                    </Select>
                  </FormControl>
                  
                  <FormControl>
                    <Select
                      value={sourceFilter}
                      onChange={(e) => setSourceFilter(e.target.value as any)}
                      placeholder="Filter by source"
                    >
                      <option value="">All Sources</option>
                      <option value="waiver_import">Waiver Import</option>
                      <option value="manual">Manual Entry</option>
                      <option value="checkfront">Checkfront</option>
                    </Select>
                  </FormControl>
                </SimpleGrid>
                
                <HStack justify="flex-end">
                  <Button
                    leftIcon={<FiRefreshCw />}
                    variant="outline"
                    onClick={loadGuests}
                    isLoading={loading}
                  >
                    Refresh
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Guest List */}
          <Card>
            <CardBody>
              <Tabs index={activeTab} onChange={(index) => setActiveTab(index)}>
                <TabList>
                  <Tab>All Guests ({filteredGuests.length})</Tab>
                  <Tab>Needs Review ({stats.needsReview})</Tab>
                  <Tab>Duplicates ({stats.duplicates})</Tab>
                  <Tab>Unmatched ({stats.unmatched})</Tab>
                </TabList>

                <TabPanels>
                  <TabPanel>
                    <GuestTable 
                      guests={filteredGuests}
                      onStatusUpdate={handleStatusUpdate}
                      getStatusColor={getStatusColor}
                      getSourceColor={getSourceColor}
                      onEdit={(id) => router.push(`/operations/guests/edit/${id}`)}
                    />
                  </TabPanel>
                  
                  <TabPanel>
                    <GuestTable 
                      guests={filteredGuests.filter(g => g.matchStatus === 'needs_review')}
                      onStatusUpdate={handleStatusUpdate}
                      getStatusColor={getStatusColor}
                      getSourceColor={getSourceColor}
                      onEdit={(id) => router.push(`/operations/guests/edit/${id}`)}
                    />
                  </TabPanel>
                  
                  <TabPanel>
                    <GuestTable 
                      guests={filteredGuests.filter(g => g.matchStatus === 'duplicate')}
                      onStatusUpdate={handleStatusUpdate}
                      getStatusColor={getStatusColor}
                      getSourceColor={getSourceColor}
                      onEdit={(id) => router.push(`/operations/guests/edit/${id}`)}
                    />
                  </TabPanel>
                  
                  <TabPanel>
                    <GuestTable 
                      guests={filteredGuests.filter(g => g.matchStatus === 'unmatched')}
                      onStatusUpdate={handleStatusUpdate}
                      getStatusColor={getStatusColor}
                      getSourceColor={getSourceColor}
                      onEdit={(id) => router.push(`/operations/guests/edit/${id}`)}
                    />
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </CardBody>
          </Card>
        </VStack>
      </Box>
    </ProtectedPage>
  );
}

// Guest Table Component
interface GuestTableProps {
  guests: Guest[];
  onStatusUpdate: (id: string, status: Guest['matchStatus']) => void;
  getStatusColor: (status?: Guest['matchStatus']) => string;
  getSourceColor: (source: Guest['source']) => string;
  onEdit: (id: string) => void;
}

function GuestTable({ 
  guests, 
  onStatusUpdate, 
  getStatusColor, 
  getSourceColor,
  onEdit 
}: GuestTableProps) {
  if (guests.length === 0) {
    return (
      <Alert status="info">
        <AlertIcon />
        <Text>No guests found matching the current filters</Text>
      </Alert>
    );
  }

  return (
    <Box overflowX="auto">
      <Table size="sm">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Phone</Th>
            <Th>Accommodation</Th>
            <Th>Source</Th>
            <Th>Priority</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {guests.map((guest) => (
            <Tr key={guest.id}>
              <Td fontWeight="medium">{guest.fullName}</Td>
              <Td>{guest.email || '-'}</Td>
              <Td>{guest.phone || '-'}</Td>
              <Td>{guest.accommodations || '-'}</Td>
              <Td>
                <Badge colorScheme={getSourceColor(guest.source)}>
                  {guest.source.replace('_', ' ')}
                </Badge>
              </Td>
              <Td>
                <Badge colorScheme={
                  guest.dataPriority === 'high' ? 'green' :
                  guest.dataPriority === 'medium' ? 'yellow' : 'gray'
                }>
                  {guest.dataPriority || 'unknown'}
                </Badge>
              </Td>
              <Td>
                <Badge colorScheme={getStatusColor(guest.matchStatus)}>
                  {guest.matchStatus?.replace('_', ' ') || 'unknown'}
                </Badge>
              </Td>
              <Td>
                <HStack spacing={1}>
                  <IconButton
                    icon={<FiEdit />}
                    aria-label="Edit guest"
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(guest.id)}
                  />
                  
                  {guest.matchStatus === 'needs_review' && (
                    <>
                      <IconButton
                        icon={<FiCheck />}
                        aria-label="Mark as matched"
                        size="sm"
                        variant="ghost"
                        colorScheme="green"
                        onClick={() => onStatusUpdate(guest.id, 'matched')}
                      />
                      <IconButton
                        icon={<FiX />}
                        aria-label="Mark as unmatched"
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => onStatusUpdate(guest.id, 'unmatched')}
                      />
                    </>
                  )}
                  
                  {guest.matchStatus === 'duplicate' && (
                    <IconButton
                      icon={<FiAlertTriangle />}
                      aria-label="Review duplicate"
                      size="sm"
                      variant="ghost"
                      colorScheme="orange"
                      onClick={() => onStatusUpdate(guest.id, 'needs_review')}
                    />
                  )}
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
