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
  Select,
  Input,
  SimpleGrid,
  useToast,
  Alert,
  AlertIcon,
  Badge,
  Divider,
} from "@chakra-ui/react";
import { useState } from "react";
import { FiDownload, FiCalendar, FiFileText, FiTruck } from "react-icons/fi";

export default function ManifestExport() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [exportType, setExportType] = useState<'manifest' | 'taxi' | 'both'>('both');
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');
  const toast = useToast();

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: `Generating ${exportType} documents for ${selectedDate}`,
      status: "info",
      duration: 3000,
      isClosable: true,
    });

    // Simulate export process
    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: `Documents ready for download`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    }, 2000);
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* Export Configuration */}
      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Heading size="md">Export Configuration</Heading>
            <Text color="textMuted">
              Generate boat manifests and taxi lists for your daily operations
            </Text>
            
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
                <Text fontWeight="bold" mb={2}>Export Type</Text>
                <Select value={exportType} onChange={(e) => setExportType(e.target.value as any)}>
                  <option value="manifest">Boat Manifests Only</option>
                  <option value="taxi">Taxi Lists Only</option>
                  <option value="both">Both Documents</option>
                </Select>
              </Box>

              <Box>
                <Text fontWeight="bold" mb={2}>Format</Text>
                <Select value={format} onChange={(e) => setFormat(e.target.value as any)}>
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                </Select>
              </Box>
            </SimpleGrid>

            <Button
              leftIcon={<FiDownload />}
              colorScheme="blue"
              size="lg"
              onClick={handleExport}
            >
              Generate Documents
            </Button>
          </VStack>
        </CardBody>
      </Card>

      {/* Preview */}
      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Heading size="md">Document Preview</Heading>
            
            <Alert status="info">
              <AlertIcon />
              Documents will include customer assignments, tank requirements, crew information, and taxi schedules.
            </Alert>

            <VStack spacing={3} align="stretch">
              {(exportType === 'manifest' || exportType === 'both') && (
                <Box p={4} borderWidth={1} borderRadius="md">
                  <HStack spacing={3}>
                    <FiFileText color="primary" size={20} />
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="bold">Boat Manifest</Text>
                      <Text fontSize="sm" color="textMuted">
                        Sea Saba I & II • {selectedDate}
                      </Text>
                      <HStack spacing={2}>
                        <Badge colorScheme="blue">4 Dive Slots</Badge>
                        <Badge colorScheme="green">Crew Assigned</Badge>
                        <Badge colorScheme="orange">Tank Calculations</Badge>
                      </HStack>
                    </VStack>
                  </HStack>
                </Box>
              )}

              {(exportType === 'taxi' || exportType === 'both') && (
                <Box p={4} borderWidth={1} borderRadius="md">
                  <HStack spacing={3}>
                    <FiTruck color="warning" size={20} />
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="bold">Taxi Lists</Text>
                      <Text fontSize="sm" color="textMuted">
                        2 Taxis • Pickup Schedule • {selectedDate}
                      </Text>
                      <HStack spacing={2}>
                        <Badge colorScheme="orange">Pickup Times</Badge>
                        <Badge colorScheme="green">Hotel Routes</Badge>
                        <Badge colorScheme="blue">Passenger Count</Badge>
                      </HStack>
                    </VStack>
                  </HStack>
                </Box>
              )}
            </VStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Recent Exports */}
      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Heading size="md">Recent Exports</Heading>
            <Text color="textMuted" fontSize="sm">
              Your previously generated documents
            </Text>
            
            <Text color="textMuted" textAlign="center" py={8}>
              No recent exports. Generate your first documents above.
            </Text>
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
}
