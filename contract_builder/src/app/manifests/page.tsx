"use client";

import { FiCalendar, FiTruck, FiUsers, FiExternalLink } from "react-icons/fi";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardBody,
  SimpleGrid,
  Text,
  HStack,
  Icon,
  VStack,
  Heading,
  useToast
} from "@chakra-ui/react";
import { useState } from "react";
import ProtectedPage from "@/components/shared/LayoutComponents/ProtectedPage";
import ManifestBoard from "@/app/manifests/components/ManifestBoard";
import TaxiScheduler from "@/app/manifests/components/TaxiScheduler";
import ManifestExport from "@/app/manifests/components/ManifestExport";

export default function ManifestsPage() {
  const [activeView, setActiveView] = useState<'manifest' | 'taxi' | 'export'>('manifest');
  const toast = useToast();
  const router = useRouter();

  const handleGoToGuestManagement = () => {
    router.push('/operations/guests');
  };

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
              Create dive assignments and generate manifests with taxi schedules
            </Text>
          </Box>

          {/* Guest Management Link */}
          <Card bg="cardBg">
            <CardBody>
              <HStack justify="space-between">
                <Box>
                  <Text fontWeight="bold">Guest Management</Text>
                  <Text fontSize="sm" color="textMuted">
                    Import and manage guest data, handle duplicates, and reconcile records
                  </Text>
                </Box>
                <Button
                  rightIcon={<FiExternalLink />}
                  colorScheme="blue"
                  variant="outline"
                  onClick={handleGoToGuestManagement}
                >
                  Open Guest Management
                </Button>
              </HStack>
            </CardBody>
          </Card>

          {/* Navigation */}
          <Card bg="cardBg">
            <CardBody>
              <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={4}>
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
