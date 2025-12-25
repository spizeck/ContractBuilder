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
import { FiUpload, FiDownload, FiTrash2, FiCheck, FiX, FiEdit2, FiSave, FiSearch } from "react-icons/fi";
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
  const [importJob, setImportJob] = useState<ImportJob | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [savedCustomers, setSavedCustomers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<string | null>(null);
  const [editedCustomer, setEditedCustomer] = useState<Customer | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  // Mock data for demonstration
  const mockCustomers: Customer[] = [
    {
      id: "1",
      bookingReference: "BK001",
      documentId: "DOC001",
      fullName: "John Doe",
      email: "john@example.com",
      phone: "+1234567890",
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
      phone: "+1234567891",
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    const newJob: ImportJob = {
      id: Date.now().toString(),
      status: 'processing',
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

  // Filter customers based on search query
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    
    const query = searchQuery.toLowerCase();
    return customers.filter(customer => 
      customer.bookingReference.toLowerCase().includes(query) ||
      customer.documentId.toLowerCase().includes(query) ||
      customer.fullName.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query) ||
      customer.accommodations?.toLowerCase().includes(query) ||
      customer.certificationLevel.toLowerCase().includes(query)
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
        const { id, createdAt, updatedAt, ...customerData } = editedCustomer;
        await customerService.addCustomer(customerData);
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
      const customerData = unsavedCustomers.map(({ id, createdAt, updatedAt, ...data }) => ({
        ...data,
        csvCreatedDate: createdAt instanceof Date ? createdAt.toISOString() : createdAt,
      }));
      
      const result = await customerService.batchImportCustomers(customerData);
      
      // Mark all customers as saved
      const newSavedCustomers = new Set([...savedCustomers, ...unsavedCustomers.map(c => c.id)]);
      setSavedCustomers(newSavedCustomers);
      
      // Show detailed results including duplicate handling
      let message = `Successfully processed ${unsavedCustomers.length} customers:\n`;
      message += `• ${result.created} new customers created\n`;
      message += `• ${result.updated} existing customers updated\n`;
      message += `• ${result.duplicates} duplicates skipped (older records)`;
      
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
      case 'email':
        normalizedValue = normalizeEmail(value);
        break;
      case 'phone':
        normalizedValue = normalizePhone(value);
        break;
      default:
        normalizedValue = value;
        break;
    }
    
    setEditedCustomer(prev => prev ? { ...prev, [field]: normalizedValue } : null);
  };

  const getEquipmentBadge = (equipment: EquipmentNeeds) => {
    const items = Object.entries(equipment)
      .filter(([key, value]) => value && key !== 'other')
      .length;
    return <Badge colorScheme="blue">{items} items</Badge>;
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* Import Section */}
      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Heading size="md">Import Customer Data</Heading>
            <Text color="textMuted">
              Upload customer data from your booking engine (CSV format recommended)
            </Text>
            
            <HStack spacing={4}>
              <Button
                leftIcon={<FiDownload />}
                variant="outline"
                onClick={downloadTemplate}
              >
                Download Template
              </Button>
              <Button
                leftIcon={<FiUpload />}
                colorScheme="blue"
                isLoading={isUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                Upload File
              </Button>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.json"
                onChange={handleFileUpload}
                display="none"
              />
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
                      <Th>Booking Ref</Th>
                      <Th>Document ID</Th>
                      <Th>Name</Th>
                      <Th>Accommodations</Th>
                      <Th>Certification</Th>
                      <Th>Nitrox</Th>
                      <Th>Equipment</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredCustomers.map((customer) => (
                      <Tr key={customer.id}>
                        <Td fontWeight="bold">
                          {editingCustomer === customer.id ? (
                            <Input
                              value={editedCustomer?.bookingReference || ''}
                              onChange={(e) => updateEditedField('bookingReference', e.target.value)}
                              size="sm"
                            />
                          ) : (
                            customer.bookingReference
                          )}
                        </Td>
                        <Td fontWeight="bold">
                          {editingCustomer === customer.id ? (
                            <Input
                              value={editedCustomer?.documentId || ''}
                              onChange={(e) => updateEditedField('documentId', e.target.value)}
                              size="sm"
                            />
                          ) : (
                            customer.documentId
                          )}
                        </Td>
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
                                value={editedCustomer?.email || ''}
                                onChange={(e) => updateEditedField('email', e.target.value)}
                                placeholder="Email"
                                size="sm"
                              />
                              <Input
                                value={editedCustomer?.phone || ''}
                                onChange={(e) => updateEditedField('phone', e.target.value)}
                                placeholder="Phone"
                                size="sm"
                              />
                            </VStack>
                          ) : (
                            <VStack align="start" spacing={0}>
                              <Text>{customer.fullName}</Text>
                              <Text fontSize="xs" color="textMuted">{customer.email}</Text>
                              <Text fontSize="xs" color="textMuted">{customer.phone}</Text>
                            </VStack>
                          )}
                        </Td>
                        <Td>
                          {editingCustomer === customer.id ? (
                            <Input
                              value={editedCustomer?.accommodations || ''}
                              onChange={(e) => updateEditedField('accommodations', e.target.value)}
                              placeholder="Accommodations"
                              size="sm"
                            />
                          ) : (
                            <Text>{customer.accommodations}</Text>
                          )}
                        </Td>
                        <Td>
                          {editingCustomer === customer.id ? (
                            <Select
                              value={editedCustomer?.certificationLevel || ''}
                              onChange={(e) => updateEditedField('certificationLevel', e.target.value)}
                              size="sm"
                            >
                              <option value="Open Water">Open Water</option>
                              <option value="Advanced">Advanced</option>
                              <option value="Rescue Diver">Rescue Diver</option>
                              <option value="Divemaster">Divemaster</option>
                              <option value="Instructor">Instructor</option>
                              <option value="Unknown">Unknown</option>
                            </Select>
                          ) : (
                            customer.certificationLevel
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
                            <VStack align="start" spacing={1}>
                              <HStack spacing={2}>
                                <Text fontSize="xs">BCD:</Text>
                                <Select
                                  value={editedCustomer?.equipmentNeeded?.bcd?.needed ? 'rental' : 'own'}
                                  onChange={(e) => {
                                    const isRental = e.target.value === 'rental';
                                    updateEditedField('equipmentNeeded', {
                                      ...editedCustomer?.equipmentNeeded,
                                      bcd: {
                                        needed: isRental,
                                        size: isRental ? 'M/L' : undefined,
                                        abbreviation: isRental ? 'BCD-M/L' : 'OWN'
                                      }
                                    });
                                  }}
                                  size="xs"
                                  width="80px"
                                >
                                  <option value="own">Own</option>
                                  <option value="rental">Rental</option>
                                </Select>
                                {editedCustomer?.equipmentNeeded?.bcd?.needed && (
                                  <Select
                                    value={editedCustomer?.equipmentNeeded?.bcd?.size || 'M'}
                                    onChange={(e) => {
                                      updateEditedField('equipmentNeeded', {
                                        ...editedCustomer?.equipmentNeeded,
                                        bcd: {
                                          ...editedCustomer?.equipmentNeeded?.bcd!,
                                          size: e.target.value,
                                          abbreviation: `BCD-${e.target.value}`
                                        }
                                      });
                                    }}
                                    size="xs"
                                    width="80px"
                                  >
                                    <option value="Wing">Wing</option>
                                    <option value="XXS">XXS</option>
                                    <option value="XS">XS</option>
                                    <option value="S">S</option>
                                    <option value="M">M</option>
                                    <option value="L">L</option>
                                    <option value="XL">XL</option>
                                    <option value="XXL">XXL</option>
                                  </Select>
                                )}
                              </HStack>
                              <HStack spacing={2}>
                                <Text fontSize="xs">Reg:</Text>
                                <Select
                                  value={editedCustomer?.equipmentNeeded?.regulator?.needed ? 'rental' : 'own'}
                                  onChange={(e) => {
                                    const isRental = e.target.value === 'rental';
                                    updateEditedField('equipmentNeeded', {
                                      ...editedCustomer?.equipmentNeeded,
                                      regulator: {
                                        needed: isRental,
                                        size: isRental ? 'M/L' : undefined,
                                        abbreviation: isRental ? 'REG-M/L' : 'OWN'
                                      }
                                    });
                                  }}
                                  size="xs"
                                  width="80px"
                                >
                                  <option value="own">Own</option>
                                  <option value="rental">Rental</option>
                                </Select>
                                {editedCustomer?.equipmentNeeded?.regulator?.needed && (
                                  <Select
                                    value={editedCustomer?.equipmentNeeded?.regulator?.size || 'NEED'}
                                    onChange={(e) => {
                                      updateEditedField('equipmentNeeded', {
                                        ...editedCustomer?.equipmentNeeded,
                                        regulator: {
                                          ...editedCustomer?.equipmentNeeded?.regulator!,
                                          size: e.target.value,
                                          abbreviation: e.target.value === 'NEED' ? 'REG-NEED' : `REG-${e.target.value}`
                                        }
                                      });
                                    }}
                                    size="xs"
                                    width="80px"
                                  >
                                    <option value="NEED">NEED</option>
                                  </Select>
                                )}
                              </HStack>
                              <HStack spacing={2}>
                                <Text fontSize="xs">Wet:</Text>
                                <Select
                                  value={editedCustomer?.equipmentNeeded?.wetsuit?.needed ? 'rental' : 'own'}
                                  onChange={(e) => {
                                    const isRental = e.target.value === 'rental';
                                    updateEditedField('equipmentNeeded', {
                                      ...editedCustomer?.equipmentNeeded,
                                      wetsuit: {
                                        needed: isRental,
                                        size: isRental ? 'M' : undefined,
                                        abbreviation: isRental ? 'WET-M' : 'OWN'
                                      }
                                    });
                                  }}
                                  size="xs"
                                  width="80px"
                                >
                                  <option value="own">Own</option>
                                  <option value="rental">Rental</option>
                                </Select>
                                {editedCustomer?.equipmentNeeded?.wetsuit?.needed && (
                                  <Select
                                    value={editedCustomer?.equipmentNeeded?.wetsuit?.size || 'M'}
                                    onChange={(e) => {
                                      updateEditedField('equipmentNeeded', {
                                        ...editedCustomer?.equipmentNeeded,
                                        wetsuit: {
                                          ...editedCustomer?.equipmentNeeded?.wetsuit!,
                                          size: e.target.value,
                                          abbreviation: `WET-${e.target.value}`
                                        }
                                      });
                                    }}
                                    size="xs"
                                    width="80px"
                                  >
                                    <option value="XS">XS</option>
                                    <option value="S">S</option>
                                    <option value="M">M</option>
                                    <option value="L">L</option>
                                    <option value="XL">XL</option>
                                    <option value="XXL">XXL</option>
                                    <option value="WXS">WXS</option>
                                    <option value="WS">WS</option>
                                    <option value="WM">WM</option>
                                    <option value="WL">WL</option>
                                    <option value="WXL">WXL</option>
                                    <option value="WXXL">WXXL</option>
                                    <option value="MS">MS</option>
                                    <option value="MM">MM</option>
                                    <option value="ML">ML</option>
                                    <option value="MXL">MXL</option>
                                    <option value="MXXL">MXXL</option>
                                    <option value="M3XL">M3XL</option>
                                  </Select>
                                )}
                              </HStack>
                            </VStack>
                          ) : (
                            getEquipmentBadge(customer.equipmentNeeded)
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
