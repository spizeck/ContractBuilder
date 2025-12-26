"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Badge,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Alert,
  AlertIcon,
  useToast,
  Radio,
  RadioGroup,
  Stack,
  Textarea,
  Progress,
  Heading,
  Spacer,
  Input,
} from "@chakra-ui/react";
import { FiUsers, FiAlertTriangle, FiCheckCircle, FiUpload, FiArrowLeft, FiDownload } from "react-icons/fi";
import { parseGuestCSV } from "@/utils/parsers/guestParser";
import { validateGuestData } from "@/services/guests";
import { 
  findPotentialDuplicates, 
  getBookingGroups,
  importGuestsFromCSV,
  mergeGuests,
  confirmDifferentGuests,
  getAllGuests,
  createGuest,
  updateGuest,
} from "@/services/guests";
import type { Guest, DuplicateGroup, BookingGroup } from "@/types/guestTypes";
import ProtectedPage from "@/components/shared/LayoutComponents/ProtectedPage";

export default function GuestImportPage() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [file, setFile] = useState<File | null>(null);
  const [parsedGuests, setParsedGuests] = useState<Partial<Guest>[]>([]);
  const [bookingGroups, setBookingGroups] = useState<Map<string, Partial<Guest>[]>>(new Map());
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [step, setStep] = useState<'upload' | 'preview' | 'resolve'>('upload');
  const [importing, setImporting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    
    if (!selected.name.endsWith('.csv')) {
      toast({
        title: 'Invalid file format',
        description: 'Please upload a CSV file',
        status: 'error',
        duration: 3000,
      });
      return;
    }
    
    setFile(selected);
    await processFile(selected);
  };

  const processFile = async (selected: File) => {
    setImporting(true);
    setUploadProgress(0);
    
    try {
      // Parse CSV
      setUploadProgress(30);
      const result = await parseGuestCSV(selected);
      
      if (result.errors.length > 0) {
        toast({
          title: 'Parse Errors',
          description: result.errors.join('; '),
          status: 'error',
          duration: 5000,
        });
        return;
      }
      
      // Validate guests
      setUploadProgress(60);
      console.log('Validating', result.guests.length, 'guests...');
      
      const validationResults = await Promise.all(
        result.guests.map(guest => validateGuestData(guest))
      );
      
      console.log('Validation results:', validationResults);
      
      const validGuests = result.guests.filter((_, index) => validationResults[index].isValid);
      
      console.log('Valid guests:', validGuests.length);
      
      setParsedGuests(validGuests);
      setUploadProgress(100);
      
      // Use booking groups from parser
      setBookingGroups(result.bookingGroups || new Map());
      setStep('preview');
      
      toast({
        title: "File parsed successfully",
        description: `Found ${validGuests.length} valid guests in ${result.bookingGroups?.size || 0} booking groups`,
        status: "success",
        duration: 3000,
      });
      
      if (result.warnings.length > 0) {
        toast({
          title: "Warnings",
          description: result.warnings.join("; "),
          status: "warning",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      toast({
        title: "Error parsing file",
        description: "Failed to parse the CSV file",
        status: "error",
        duration: 3000,
      });
    } finally {
      setImporting(false);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const dropped = e.dataTransfer.files[0];
    if (!dropped) return;
    
    if (!dropped.name.endsWith('.csv')) {
      toast({
        title: 'Invalid file format',
        description: 'Please upload a CSV file',
        status: 'error',
        duration: 3000,
      });
      return;
    }
    
    setFile(dropped);
    await processFile(dropped);
  };
  
  const handleCheckDuplicates = async () => {
    if (!user) return;
    
    console.log('Starting duplicate check...');
    console.log('Parsed guests:', parsedGuests.length);
    
    setImporting(true);
    
    try {
      const existingGuests = await getAllGuests();
      console.log('Existing guests:', existingGuests.guests?.length || 0);
      
      const allDuplicates: DuplicateGroup[] = [];
      
      for (const newGuest of parsedGuests) {
        const duplicates = await findPotentialDuplicates(newGuest, existingGuests.guests || []);
        allDuplicates.push(...duplicates);
      }
      
      console.log('Duplicates found:', allDuplicates.length);
      
      if (allDuplicates.length > 0) {
        setDuplicateGroups(allDuplicates);
        setStep('resolve');
        
        toast({
          title: "Potential duplicates found",
          description: `Found ${allDuplicates.length} duplicate group(s) that need review`,
          status: "warning",
          duration: 5000,
        });
      } else {
        console.log('No duplicates found, proceeding with import...');
        // No duplicates, proceed with import
        await handleFinalImport();
      }
    } catch (error) {
      console.error('Error checking duplicates:', error);
      toast({
        title: "Error checking duplicates",
        status: "error",
        duration: 3000,
      });
    } finally {
      setImporting(false);
    }
  };
  
  const handleFinalImport = async () => {
    if (!file || !user || parsedGuests.length === 0) return;
    
    setImporting(true);
    
    try {
      // Import guests
      const result = await importGuestsFromCSV(parsedGuests, file.name, user.uid);
      
      toast({
        title: "Import Complete",
        description: `${result.imported} guests imported, ${result.duplicates.length} duplicates found`,
        status: "success",
        duration: 5000,
      });
      
      // Reset and redirect
      setStep('upload');
      setFile(null);
      setParsedGuests([]);
      setBookingGroups(new Map());
      setDuplicateGroups([]);
      
      router.push('/operations/guests');
    } catch (error) {
      console.error('Error importing:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        status: "error",
        duration: 5000,
      });
    } finally {
      setImporting(false);
    }
  };
  
  const handleResolveDuplicate = async (group: DuplicateGroup, action: 'merge' | 'different' | 'skip', notes?: string) => {
    if (!user) return;
    
    try {
      if (action === 'merge') {
        // Merge the suspects
        await mergeGuests(group.suspects, user.uid, notes);
      } else if (action === 'different') {
        // Mark as confirmed different
        await confirmDifferentGuests(group.suspects, user.uid, notes);
      }
      
      // Remove from list
      setDuplicateGroups(prev => prev.filter(g => g !== group));
      
      toast({
        title: "Duplicate resolved",
        description: `Group marked as ${action}`,
        status: "success",
        duration: 3000,
      });
      
      // If all duplicates are resolved, proceed with import
      if (duplicateGroups.length === 1) { // Will be 0 after removal
        await handleFinalImport();
      }
    } catch (error) {
      console.error('Error resolving duplicate:', error);
      toast({
        title: "Error resolving duplicate",
        status: "error",
        duration: 3000,
      });
    }
  };
  
  return (
    <ProtectedPage allowedRoles={['admin', 'hotel-manager', 'hotel-staff']}>
      <Box p={6} maxW="full">
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <HStack>
            <Button
              leftIcon={<FiArrowLeft />}
              variant="outline"
              onClick={() => router.push('/operations/guests')}
            >
              Back to Guests
            </Button>
            <Spacer />
            <Button
              leftIcon={<FiDownload />}
              variant="outline"
              onClick={() => {
                // TODO: Download template
                toast({
                  title: "Template download",
                  description: "CSV template download coming soon",
                  status: "info",
                });
              }}
            >
              Download Template
            </Button>
          </HStack>
          
          <Heading size="lg">Import Guests</Heading>
          
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <VStack spacing={4} align="stretch">
              <Box
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                borderColor={isDragging ? "blue.400" : undefined}
                bg={isDragging ? "blue.50" : undefined}
                borderWidth="2px"
                borderStyle="dashed"
                borderRadius="md"
                p={4}
                transition="all 0.2s"
              >
                <Input
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  display="none"
                  id="csv-upload"
                />
                <Button
                  as="label"
                  htmlFor="csv-upload"
                  leftIcon={<FiUpload />}
                  colorScheme="blue"
                  size="lg"
                  h="100px"
                  variant="ghost"
                  isLoading={importing && uploadProgress > 0}
                  cursor="pointer"
                  w="full"
                >
                  {importing && uploadProgress > 0 ? 'Processing...' : 
                   isDragging ? 'Drop CSV file here' : 'Select CSV File or Drag & Drop'}
                </Button>
              </Box>
              
              {importing && uploadProgress > 0 && (
                <Progress
                  value={uploadProgress}
                  size="sm"
                  colorScheme="blue"
                  w="full"
                />
              )}
              
              {file && (
                <Text color="textMuted">
                  Selected: {file.name}
                </Text>
              )}
            </VStack>
          )}
          
          {/* Step 2: Preview Groups */}
          {step === 'preview' && (
            <VStack spacing={4} align="stretch">
              <Alert status="info">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold">
                    Preview: {parsedGuests.length} guests in {bookingGroups.size} booking groups
                  </Text>
                  <Text fontSize="sm">
                    Review groups below. Guests with the same booking ID will be grouped together.
                  </Text>
                </Box>
              </Alert>
              
              <Accordion allowMultiple defaultIndex={[0]}>
                {Array.from(bookingGroups.entries()).map(([bookingCode, guests]) => (
                  <AccordionItem key={bookingCode}>
                    <AccordionButton>
                      <Box flex="1" textAlign="left">
                        <HStack>
                          <FiUsers />
                          <Text fontWeight="bold">
                            {bookingCode || 'No Booking Code'}
                          </Text>
                          <Badge>{guests.length} guest{guests.length !== 1 ? 's' : ''}</Badge>
                          {guests.some(g => !g.bookingCode) && (
                            <Badge colorScheme="yellow">Missing booking code</Badge>
                          )}
                        </HStack>
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel>
                      <Table size="sm">
                        <Thead>
                          <Tr>
                            <Th>Name</Th>
                            <Th>Email</Th>
                            <Th>Phone</Th>
                            <Th>Accommodations</Th>
                            <Th>Certification</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {guests.map((guest, idx) => (
                            <Tr key={idx}>
                              <Td>{guest.fullName}</Td>
                              <Td>{guest.email || '-'}</Td>
                              <Td>{guest.phone || '-'}</Td>
                              <Td>{guest.accommodations || '-'}</Td>
                              <Td>{guest.certificationLevel || '-'}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </AccordionPanel>
                  </AccordionItem>
                ))}
              </Accordion>
              
              <HStack>
                <Button onClick={() => setStep('upload')}>Back</Button>
                <Spacer />
                <Button
                  colorScheme="blue"
                  onClick={handleCheckDuplicates}
                  isLoading={importing}
                  leftIcon={<FiUpload />}
                >
                  Check for Duplicates & Import
                </Button>
              </HStack>
            </VStack>
          )}
          
          {/* Step 3: Resolve Duplicates */}
          {step === 'resolve' && (
            <VStack spacing={4} align="stretch">
              <Alert status="warning">
                <AlertIcon />
                <Text>
                  Found {duplicateGroups.length} potential duplicate group(s). Please review and resolve.
                </Text>
              </Alert>
              
              {duplicateGroups.map((group, idx) => (
                <DuplicateResolutionCard
                  key={idx}
                  group={group}
                  onResolve={(action, notes) => handleResolveDuplicate(group, action, notes)}
                />
              ))}
              
              <HStack>
                <Button onClick={() => setStep('preview')}>Back</Button>
                <Spacer />
                <Button
                  colorScheme="blue"
                  onClick={handleFinalImport}
                  isDisabled={duplicateGroups.length > 0}
                  isLoading={importing}
                >
                  Complete Import ({duplicateGroups.length} remaining)
                </Button>
              </HStack>
            </VStack>
          )}
        </VStack>
      </Box>
    </ProtectedPage>
  );
}

interface DuplicateResolutionCardProps {
  group: DuplicateGroup;
  onResolve: (action: 'merge' | 'different' | 'skip', notes?: string) => void;
}

function DuplicateResolutionCard({ group, onResolve }: DuplicateResolutionCardProps) {
  const [action, setAction] = useState<'merge' | 'different' | 'skip'>('skip');
  const [notes, setNotes] = useState('');
  const [isResolved, setIsResolved] = useState(false);
  
  const handleResolve = () => {
    setIsResolved(true);
    onResolve(action, notes || undefined);
  };
  
  if (isResolved) {
    return (
      <Box borderWidth="1px" borderRadius="md" p={4} opacity="0.6">
        <HStack>
          <FiCheckCircle color="green" />
          <Text fontWeight="bold" color="green.600">Resolved</Text>
          <Badge colorScheme="green">{action}</Badge>
        </HStack>
      </Box>
    );
  }
  
  return (
    <Box borderWidth="1px" borderRadius="md" p={4}>
      <HStack justify="space-between" mb={4}>
        <HStack>
          <FiAlertTriangle color="orange" />
          <Text fontWeight="bold">Potential Duplicate Group</Text>
        </HStack>
        <Badge colorScheme={
          group.confidence === 'high' ? 'red' : 
          group.confidence === 'medium' ? 'yellow' : 'gray'
        }>
          {group.confidence} confidence
        </Badge>
      </HStack>
      
      <Text fontSize="sm" color="gray.600" mb={2}>
        Reasons: {group.matchReasons.join(', ')}
      </Text>
      
      <Table size="sm" mb={4}>
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Booking ID</Th>
            <Th>Email</Th>
            <Th>Phone</Th>
            <Th>Source</Th>
          </Tr>
        </Thead>
        <Tbody>
          {group.suspects.map((guest, idx) => (
            <Tr key={idx}>
              <Td>{guest.fullName}</Td>
              <Td>{guest.bookingId || '-'}</Td>
              <Td>{guest.email || '-'}</Td>
              <Td>{guest.phone || '-'}</Td>
              <Td>
                <Badge size="sm">{guest.source}</Badge>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      
      <RadioGroup value={action} onChange={(val) => setAction(val as any)}>
        <Stack spacing={2}>
          <Radio value="merge">
            <Text fontSize="sm">
              <strong>Merge</strong> - These are the same person, combine records
            </Text>
          </Radio>
          <Radio value="different">
            <Text fontSize="sm">
              <strong>Different People</strong> - Same name/contact but different guests (e.g., family members)
            </Text>
          </Radio>
          <Radio value="skip">
            <Text fontSize="sm">
              <strong>Review Later</strong> - Import both and decide later
            </Text>
          </Radio>
        </Stack>
      </RadioGroup>
      
      <Textarea
        placeholder="Add notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        size="sm"
        mt={3}
      />
      
      <HStack mt={3}>
        <Spacer />
        <Button
          size="sm"
          colorScheme="blue"
          onClick={handleResolve}
          isDisabled={action === 'skip' && !notes}
        >
          Resolve
        </Button>
      </HStack>
    </Box>
  );
}
