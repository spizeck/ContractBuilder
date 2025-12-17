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
  SimpleGrid,
  useToast,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { useState } from "react";
import { FiUpload, FiCalendar, FiUsers, FiTruck } from "react-icons/fi";
import ProtectedPage from "@/components/shared/LayoutComponents/ProtectedPage";
import CustomerImport from "@/app/manifests/components/CustomerImport";
import ManifestBoard from "@/app/manifests/components/ManifestBoard";
import TaxiScheduler from "@/app/manifests/components/TaxiScheduler";
import ManifestExport from "@/app/manifests/components/ManifestExport";

export default function ManifestsPage() {
  const [activeView, setActiveView] = useState<'import' | 'manifest' | 'taxi' | 'export'>('import');
  const toast = useToast();

  return (
    <ProtectedPage allowedRoles={['admin', 'hotel-manager', 'hotel-staff']}>
      <Box p={6} maxW="full">
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Box>
            <Heading size="lg" mb={2}>
              Boat Manifests & Taxi Lists
            </Heading>
            <Text color="textMuted">
              Import customer data, create dive assignments, and generate manifests with taxi schedules
            </Text>
          </Box>

          {/* Navigation */}
          <Card bg="cardBg">
            <CardBody>
              <SimpleGrid columns={{ base: 2, lg: 4 }} spacing={4}>
                <Button
                  leftIcon={<FiUpload />}
                  variant={activeView === 'import' ? 'solid' : 'outline'}
                  colorScheme="blue"
                  onClick={() => setActiveView('import')}
                >
                  Import Customers
                </Button>
                <Button
                  leftIcon={<FiCalendar />}
                  variant={activeView === 'manifest' ? 'solid' : 'outline'}
                  colorScheme="green"
                  onClick={() => setActiveView('manifest')}
                >
                  Create Manifests
                </Button>
                <Button
                  leftIcon={<FiTruck />}
                  variant={activeView === 'taxi' ? 'solid' : 'outline'}
                  colorScheme="orange"
                  onClick={() => setActiveView('taxi')}
                >
                  Schedule Taxis
                </Button>
                <Button
                  leftIcon={<FiUsers />}
                  variant={activeView === 'export' ? 'solid' : 'outline'}
                  colorScheme="purple"
                  onClick={() => setActiveView('export')}
                >
                  Export Documents
                </Button>
              </SimpleGrid>
            </CardBody>
          </Card>

          {/* Content Area */}
          <Box>
            {activeView === 'import' && (
              <CustomerImport />
            )}
            {activeView === 'manifest' && (
              <ManifestBoard />
            )}
            {activeView === 'taxi' && (
              <TaxiScheduler />
            )}
            {activeView === 'export' && (
              <ManifestExport />
            )}
          </Box>
        </VStack>
      </Box>
    </ProtectedPage>
  );
}
