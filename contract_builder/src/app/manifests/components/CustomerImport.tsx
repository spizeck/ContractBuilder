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
  InputGroup,
  InputLeftElement,
  Alert,
  AlertIcon,
  Progress,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  FormControl,
  FormLabel,
  Select,
} from "@chakra-ui/react";
import { useState, useRef, useMemo } from "react";
import { FiUpload, FiDownload, FiTrash2, FiCheck, FiX, FiEdit2, FiSave, FiSearch, FiArrowLeft } from "react-icons/fi";
import { useRouter } from "next/navigation";
import Papa, { ParseResult } from "papaparse";
import { 
  Customer, 
  ImportJob, 
  EquipmentNeeds 
} from "@/types/manifestTypes";
import { parseCheckfrontCSV } from "@/utils/parsers";
import { customerService } from "@/services/customers";
import { normalizeName, normalizeEmail, normalizePhone } from "@/utils/stringUtils";

export default function CustomerImport() {
  const router = useRouter();
  const [importJob, setImportJob] = useState<ImportJob | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [savedCustomers, setSavedCustomers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<string | null>(null);
  const [editedCustomer, setEditedCustomer] = useState<Customer | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  // Mock data for demonstration
  const mockCustomers: Customer[] = [
    {
      id: "1",
      fullName: "John Doe",
      emailLower: "john@example.com",
      phoneE164: "+1234567890",
      dob: null,
      notesGeneral: null,
      accommodations: "Sea Saba Hotel",
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
      accommodations: "Queen's Gardens Resort",
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    const newJob: ImportJob = {
      id: Date.now().toString(),
      status: 'processing',
      fileName: file.name,
      totalRecords: 0,
      processedRecords: 0,
      errors: [],
      createdAt: new Date(),
    };
    setImportJob(newJob);

    try {
      // Parse CSV with Papa Parse
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results: ParseResult<any>) => {
          console.log('CSV parsing results:', results);
          
          if (results.errors.length > 0) {
            console.error('CSV parsing errors:', results.errors);
            setImportJob(prev => 
              prev ? {
                ...prev,
                status: 'failed',
                errors: results.errors.map((err: any) => err.message)
              } : null
            );
            setIsUploading(false);
            toast({
              title: "CSV Parsing Error",
              description: "Failed to parse CSV file. Please check the format.",
              status: "error",
              duration: 5000,
              isClosable: true,
            });
            return;
          }

          // Parse Checkfront data using equipmentParser
          const parsedCustomers = parseCheckfrontCSV(results.data);
          console.log('Parsed customers:', parsedCustomers);

          // Update import job with actual counts
          setImportJob(prev => 
            prev ? {
              ...prev,
              status: 'completed',
              totalRecords: results.data.length,
              processedRecords: parsedCustomers.length,
              errors: parsedCustomers.length < results.data.length 
                ? [`Failed to parse ${results.data.length - parsedCustomers.length} records`] 
                : []
            } : null
          );

          setCustomers(parsedCustomers);
          setIsUploading(false);
          setUploadProgress(100);

          toast({
            title: "Import Complete",
            description: `Successfully parsed ${parsedCustomers.length} customers from ${results.data.length} records`,
            status: "success",
            duration: 5000,
            isClosable: true,
          });
        },
        error: (error: any) => {
          console.error('File reading error:', error);
          setImportJob(prev => 
            prev ? {
              ...prev,
              status: 'failed',
              errors: [error.message]
            } : null
          );
          setIsUploading(false);
          toast({
            title: "File Upload Error",
            description: error.message,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      setImportJob(prev => 
        prev ? {
          ...prev,
          status: 'failed',
          errors: [error instanceof Error ? error.message : 'Unknown error']
        } : null
      );
      setIsUploading(false);
      toast({
        title: "Upload Error",
        description: "Failed to process file",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const downloadTemplate = () => {
    // Create CSV template
    const csvContent = `Booking Reference,First Name,Last Name,Email,Phone,Hotel,Room Number,Certification Level,Nitrox Certified,BCD,Regulator,Mask,Fins,Wetsuit,Other Equipment,Special Requirements
BK001,John,Doe,john@example.com,+1234567890,Sea Saba Resort,101,Open Water,Yes,Yes,Yes,No,No,Yes,,
BK002,Jane,Smith,jane@example.com,+1234567891,Sea Saba Resort,102,Advanced,No,Yes,Yes,Yes,Yes,Yes,`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customer-import-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearCustomers = () => {
    setCustomers([]);
    setImportJob(null);
    setSearchQuery('');
    setEditingCustomer(null);
    setEditedCustomer(null);
    toast({
      title: "Data Cleared",
      description: "All imported customer data has been removed",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        // Trigger file upload
        const event = {
          target: { files: [file] }
        } as any;
        handleFileUpload(event);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a CSV file",
          status: "error",
          duration: 3000,
        });
      }
    }
  };

  // Filter customers based on search query
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    
    const query = searchQuery.toLowerCase();
    return customers.filter(customer => 
      customer.fullName.toLowerCase().includes(query) ||
      (customer.emailLower && customer.emailLower.includes(query)) ||
      (customer.phoneE164 && customer.phoneE164.includes(query)) ||
      (customer.certLevel && customer.certLevel.toLowerCase().includes(query))
    );
  }, [customers, searchQuery]);

  // Start editing a customer
  const startEditing = (customer: Customer) => {
    setEditingCustomer(customer.id);
    setEditedCustomer({ ...customer });
  };

  // Save edited customer
  const saveCustomer = async () => {
    if (!editedCustomer) return;
    
    try {
      // Check if customer exists in Firestore
      if (savedCustomers.has(editedCustomer.id)) {
        // Update existing customer
        await customerService.updateCustomer(editedCustomer.id, editedCustomer);
      } else {
        // Create new customer in Firestore
        const { createdAt, updatedAt, ...customerData } = editedCustomer;
        await customerService.createCustomer(customerData);
        setSavedCustomers(prev => new Set([...prev, editedCustomer.id]));
      }
      
      setCustomers(prev => prev.map(customer => 
        customer.id === editedCustomer.id ? editedCustomer : customer
      ));
      
      setEditingCustomer(null);
      setEditedCustomer(null);
      
      toast({
        title: "Customer Updated",
        description: `${editedCustomer.fullName} has been saved to Firestore`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error saving customer:', error);
      toast({
        title: "Save Error",
        description: "Failed to save customer to Firestore",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Save all customers to Firestore with duplicate prevention
  const saveAllCustomers = async () => {
    if (customers.length === 0) return;
    
    setIsSaving(true);
    try {
      const unsavedCustomers = customers.filter(customer => !savedCustomers.has(customer.id));
      
      if (unsavedCustomers.length === 0) {
        toast({
          title: "All Customers Saved",
          description: "All customers are already saved to Firestore",
          status: "info",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      // Prepare customer data with CSV created dates for duplicate comparison
      const customerData = unsavedCustomers.map(({ createdAt, updatedAt, ...data }) => ({
        ...data,
        csvCreatedDate: createdAt instanceof Date ? createdAt.toISOString() : createdAt,
      }));
      
      const result = await customerService.bulkCreateCustomers(customerData);
      
      // Mark all customers as saved
      const newSavedCustomers = new Set([...savedCustomers, ...unsavedCustomers.map(c => c.id)]);
      setSavedCustomers(newSavedCustomers);
      
      // Show results
      const message = `Successfully saved ${result.length} customers to Firestore`;
      
      toast({
        title: "Import Complete with Duplicate Prevention",
        description: message,
        status: "success",
        duration: 8000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error saving customers:', error);
      toast({
        title: "Save Error",
        description: "Failed to save customers to Firestore",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingCustomer(null);
    setEditedCustomer(null);
  };

  // Update edited customer field with normalization
  const updateEditedField = (field: keyof Customer, value: any) => {
    if (!editedCustomer) return;
    
    let normalizedValue = value;
    
    // Apply normalization based on field type
    switch (field) {
      case 'fullName':
        normalizedValue = normalizeName(value);
        break;
      case 'emailLower':
        normalizedValue = normalizeEmail(value);
        break;
      case 'phoneE164':
        normalizedValue = normalizePhone(value);
        break;
      default:
        normalizedValue = value;
        break;
    }
    
    setEditedCustomer(prev => prev ? { ...prev, [field]: normalizedValue } : null);
  };

  const getEquipmentBadge = (gear: any) => {
    if (!gear) return <Badge colorScheme="gray">No gear</Badge>;
    const items = Object.entries(gear)
      .filter(([key, value]) => value && (value as any).needRental)
      .length;
    return <Badge colorScheme="blue">{items} rentals</Badge>;
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* Header with back button */}
      <HStack justify="space-between">
        <Button
          leftIcon={<FiArrowLeft />}
          variant="ghost"
          onClick={() => router.back()}
        >
          Back
        </Button>
        <Heading size="lg">Import Customer Data</Heading>
        <Box w="40px" /> {/* Spacer for centering */}
      </HStack>

      {/* Import Section */}
      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Text color="textMuted">
              Upload customer data from your booking engine (CSV format recommended)
            </Text>
            
            {/* Drag and Drop Area */}
            <Box
              border="2px dashed"
              borderColor={isDragging ? "info" : "border"}
              borderRadius="md"
              p={8}
              textAlign="center"
              bg={isDragging ? "infoBg" : "cardBgAlt"}
              transition="all 0.2s"
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              cursor="pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <VStack spacing={2}>
                <Box
                  as={FiUpload}
                  size={48}
                  color={isDragging ? "info" : "textMuted"}
                />
                <Text fontSize="lg" fontWeight="medium">
                  {isDragging ? "Drop your CSV file here" : "Drag and drop your CSV file here"}
                </Text>
                <Text fontSize="sm" color="textMuted">
                  or click to browse
                </Text>
              </VStack>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.json"
                onChange={handleFileUpload}
                display="none"
              />
            </Box>
            
            <HStack spacing={4} justify="center">
              <Button
                leftIcon={<FiDownload />}
                variant="outline"
                onClick={downloadTemplate}
              >
                Download Template
              </Button>
              {customers.length > 0 && (
                <Button
                  leftIcon={<FiTrash2 />}
                  variant="outline"
                  colorScheme="red"
                  onClick={clearCustomers}
                >
                  Clear Data
                </Button>
              )}
            </HStack>

            {importJob && (
              <Box>
                <HStack justify="space-between" mb={2}>
                  <Text fontSize="sm">
                    Processing: {importJob.processedRecords} / {importJob.totalRecords}
                  </Text>
                  <Badge colorScheme={
                    importJob.status === 'completed' ? 'green' :
                    importJob.status === 'processing' ? 'blue' : 'red'
                  }>
                    {importJob.status}
                  </Badge>
                </HStack>
                <Progress 
                  value={uploadProgress} 
                  colorScheme="blue" 
                  size="sm"
                  isIndeterminate={importJob.status === 'processing'}
                />
              </Box>
            )}
          </VStack>
        </CardBody>
      </Card>

      {/* Customer List */}
      {customers.length > 0 && (
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between" align="center">
                <Heading size="md">
                  Imported Customers ({customers.length})
                </Heading>
                <Text fontSize="sm" color="textMuted">
                  Showing {filteredCustomers.length} of {customers.length}
                </Text>
              </HStack>

              {/* Search Bar */}
              <HStack spacing={4}>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <FiSearch color="gray.300" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search by booking reference, document ID, name, email, accommodations, or certification..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </InputGroup>
                <Button
                  leftIcon={<FiX />}
                  variant="outline"
                  onClick={() => setSearchQuery('')}
                  isDisabled={!searchQuery}
                >
                  Clear
                </Button>
              </HStack>
              
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Name</Th>
                      <Th>Certification</Th>
                      <Th>Nitrox</Th>
                      <Th>Equipment</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredCustomers.map((customer) => (
                      <Tr key={customer.id}>
                                                <Td>
                          {editingCustomer === customer.id ? (
                            <VStack align="start" spacing={2}>
                              <Input
                                value={editedCustomer?.fullName || ''}
                                onChange={(e) => updateEditedField('fullName', e.target.value)}
                                placeholder="Full name"
                                size="sm"
                              />
                              <Input
                                value={editedCustomer?.emailLower || ''}
                                onChange={(e) => updateEditedField('emailLower', e.target.value)}
                                placeholder="Email"
                                size="sm"
                              />
                              <Input
                                value={editedCustomer?.phoneE164 || ''}
                                onChange={(e) => updateEditedField('phoneE164', e.target.value)}
                                placeholder="Phone"
                                size="sm"
                              />
                            </VStack>
                          ) : (
                            <VStack align="start" spacing={0}>
                              <Text>{customer.fullName}</Text>
                              <Text fontSize="xs" color="textMuted">{customer.emailLower}</Text>
                              <Text fontSize="xs" color="textMuted">{customer.phoneE164}</Text>
                            </VStack>
                          )}
                        </Td>
                        <Td>
                          {editingCustomer === customer.id ? (
                            <Select
                              value={editedCustomer?.certLevel || ''}
                              onChange={(e) => updateEditedField('certLevel', e.target.value)}
                              size="sm"
                            >
                              <option value="">None</option>
                              <option value="Open Water">Open Water</option>
                              <option value="Advanced">Advanced</option>
                              <option value="Rescue">Rescue</option>
                              <option value="Divemaster">Divemaster</option>
                              <option value="Instructor">Instructor</option>
                            </Select>
                          ) : (
                            <Badge variant="outline">
                              {customer.certLevel || 'None'}
                            </Badge>
                          )}
                        </Td>
                        <Td>
                          {editingCustomer === customer.id ? (
                            <Select
                              value={editedCustomer?.nitroxCertified ? 'true' : 'false'}
                              onChange={(e) => updateEditedField('nitroxCertified', e.target.value === 'true')}
                              size="sm"
                            >
                              <option value="false">No</option>
                              <option value="true">Yes</option>
                            </Select>
                          ) : (
                            <Badge colorScheme={customer.nitroxCertified ? 'green' : 'gray'}>
                              {customer.nitroxCertified ? 'Yes' : 'No'}
                            </Badge>
                          )}
                        </Td>
                        <Td>
                          {editingCustomer === customer.id ? (
                            <Text fontSize="sm" color="textMuted">
                              Equipment editing not available in this view
                            </Text>
                          ) : (
                            getEquipmentBadge(customer.gearDefault)
                          )}
                        </Td>
                        <Td>
                          {editingCustomer === customer.id ? (
                            <HStack spacing={2}>
                              <IconButton
                                aria-label="Save customer"
                                icon={<FiSave />}
                                size="sm"
                                colorScheme="green"
                                onClick={saveCustomer}
                              />
                              <IconButton
                                aria-label="Cancel editing"
                                icon={<FiX />}
                                size="sm"
                                variant="outline"
                                onClick={cancelEditing}
                              />
                            </HStack>
                          ) : (
                            <HStack spacing={2}>
                              <IconButton
                                aria-label="Edit customer"
                                icon={<FiEdit2 />}
                                size="sm"
                                variant="outline"
                                onClick={() => startEditing(customer)}
                              />
                              <Badge colorScheme="green">
                                <FiCheck style={{ display: 'inline', marginRight: '4px' }} />
                                Ready
                              </Badge>
                            </HStack>
                          )}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>

              <HStack justify="space-between" align="center">
                <Alert status="success" flex={1}>
                  <AlertIcon />
                  Customer data imported successfully! Review and edit if needed, then save to Firestore.
                </Alert>
                <Button
                  leftIcon={<FiSave />}
                  colorScheme="blue"
                  onClick={saveAllCustomers}
                  isLoading={isSaving}
                  loadingText="Saving..."
                  isDisabled={customers.length === 0}
                >
                  Save All to Firestore ({customers.filter(c => !savedCustomers.has(c.id)).length})
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      )}
    </VStack>
  );
}
