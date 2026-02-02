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
  useToast,
  Input,
  Divider,
} from "@chakra-ui/react";
import { useState } from "react";
import { Boat } from "@/types/diveLogTypes";
import ProtectedPage from "@/components/shared/LayoutComponents/ProtectedPage";
import DayManifestEditor from "@/app/manifests/components/DayManifestEditor";
import TaxiSchedulerNew from "@/app/manifests/components/TaxiSchedulerNew";
import ManifestExport from "@/app/manifests/components/ManifestExport";

export default function ManifestsPage() {
  const [activeView, setActiveView] = useState<'day-manifest' | 'taxi-schedule' | 'export'>('day-manifest');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const toast = useToast();
  const router = useRouter();

  const handleGoToGuestManagement = () => {
    router.push('/operations/customers');
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

          {/* Date Selection */}
          <Card bg="cardBg">
            <CardBody>
              <HStack spacing={4}>
                <VStack align="start" spacing={0}>
                  <Text fontWeight="bold">Select Date</Text>
                  <Text fontSize="sm" color="textMuted">
                    Choose the date for manifest planning
                  </Text>
                </VStack>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  maxW="200px"
                />
              </HStack>
            </CardBody>
          </Card>

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
              <VStack spacing={4}>
                <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={4}>
                  <Button
                    leftIcon={<FiCalendar />}
                    variant={activeView === 'day-manifest' ? 'solid' : 'outline'}
                    colorScheme="green"
                    onClick={() => setActiveView('day-manifest')}
                  >
                    Day Manifest
                  </Button>
                  <Button
                    leftIcon={<FiTruck />}
                    variant={activeView === 'taxi-schedule' ? 'solid' : 'outline'}
                    colorScheme="orange"
                    onClick={() => setActiveView('taxi-schedule')}
                  >
                    Taxi Schedule
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
              </VStack>
            </CardBody>
          </Card>

          {/* Content Area */}
          <Box>
            {activeView === 'day-manifest' && (
              <DayManifestEditor 
                selectedDate={selectedDate} 
                boats={[
                  { id: "boat1", name: "Sea Saba I", capacity: 12, maxDiveSlots: 4, active: true },
                  { id: "boat2", name: "Sea Saba II", capacity: 10, maxDiveSlots: 4, active: true },
                ]} 
              />
            )}
            {activeView === 'taxi-schedule' && (
              <TaxiSchedulerNew selectedDate={selectedDate} />
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
