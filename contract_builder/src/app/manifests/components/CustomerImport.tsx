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
} from "@chakra-ui/react";
import { useState, useRef } from "react";
import { FiUpload, FiDownload, FiTrash2, FiCheck, FiX } from "react-icons/fi";
import { 
  Customer, 
  ImportJob, 
  EquipmentNeeds 
} from "@/types/manifestTypes";

export default function CustomerImport() {
  const [importJob, setImportJob] = useState<ImportJob | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  // Mock data for demonstration
  const mockCustomers: Customer[] = [
    {
      id: "1",
      bookingReference: "BK001",
      fullName: "John Doe",
      email: "john@example.com",
      phone: "+1234567890",
      hotel: "Sea Saba Resort",
      roomNumber: "101",
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
      fullName: "Jane Smith",
      email: "jane@example.com",
      phone: "+1234567891",
      hotel: "Sea Saba Resort",
      roomNumber: "102",
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

    // Simulate file processing
    const newJob: ImportJob = {
      id: Date.now().toString(),
      status: 'processing',
      totalRecords: 100,
      processedRecords: 0,
      errors: [],
      createdAt: new Date(),
    };
    setImportJob(newJob);

    // Simulate progress
    const interval = setInterval(() => {
      setImportJob(prev => {
        if (!prev) return null;
        const processed = Math.min(prev.processedRecords + 10, prev.totalRecords);
        setUploadProgress((processed / prev.totalRecords) * 100);
        
        if (processed >= prev.totalRecords) {
          clearInterval(interval);
          setIsUploading(false);
          setCustomers(mockCustomers);
          toast({
            title: "Import Complete",
            description: `Successfully imported ${mockCustomers.length} customers`,
            status: "success",
            duration: 5000,
            isClosable: true,
          });
          return { ...prev, status: 'completed', processedRecords: processed };
        }
        
        return { ...prev, processedRecords: processed };
      });
    }, 200);
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
    toast({
      title: "Data Cleared",
      description: "All imported customer data has been removed",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
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
              <Heading size="md">
                Imported Customers ({customers.length})
              </Heading>
              
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Booking Ref</Th>
                      <Th>Name</Th>
                      <Th>Hotel</Th>
                      <Th>Certification</Th>
                      <Th>Nitrox</Th>
                      <Th>Equipment</Th>
                      <Th>Status</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {customers.map((customer) => (
                      <Tr key={customer.id}>
                        <Td fontWeight="bold">{customer.bookingReference}</Td>
                        <Td>
                          <VStack align="start" spacing={0}>
                            <Text>{customer.fullName}</Text>
                            <Text fontSize="xs" color="textMuted">{customer.email}</Text>
                          </VStack>
                        </Td>
                        <Td>
                          <VStack align="start" spacing={0}>
                            <Text>{customer.hotel}</Text>
                            <Text fontSize="xs" color="textMuted">Room {customer.roomNumber}</Text>
                          </VStack>
                        </Td>
                        <Td>{customer.certificationLevel}</Td>
                        <Td>
                          <Badge colorScheme={customer.nitroxCertified ? 'green' : 'gray'}>
                            {customer.nitroxCertified ? 'Yes' : 'No'}
                          </Badge>
                        </Td>
                        <Td>{getEquipmentBadge(customer.equipmentNeeded)}</Td>
                        <Td>
                          <Badge colorScheme="green">
                            <FiCheck style={{ display: 'inline', marginRight: '4px' }} />
                            Ready
                          </Badge>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>

              <Alert status="success">
                <AlertIcon />
                Customer data imported successfully! You can now proceed to create manifests.
              </Alert>
            </VStack>
          </CardBody>
        </Card>
      )}
    </VStack>
  );
}
