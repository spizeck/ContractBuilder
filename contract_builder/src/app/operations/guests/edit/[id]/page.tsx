"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Heading,
  useToast,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  Select,
  Textarea,
  Switch,
  Alert,
  AlertIcon,
  Card,
  CardBody,
  SimpleGrid,
  Divider,
  Badge,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@chakra-ui/react";
import { FiArrowLeft, FiSave, FiTrash2, FiUser, FiPhone, FiMail, FiHome } from "react-icons/fi";
import { getGuestById, updateGuest, deleteGuest } from "@/services/guests";
import type { Guest } from "@/types/guestTypes";
import ProtectedPage from "@/components/shared/LayoutComponents/ProtectedPage";

export default function GuestEditPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const guestId = params.id as string;
  
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  
  // State
  const [guest, setGuest] = useState<Guest | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Guest>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Load guest data
  useEffect(() => {
    if (guestId) {
      loadGuest();
    }
  }, [guestId]);

  const loadGuest = async () => {
    try {
      const guestData = await getGuestById(guestId);
      if (guestData) {
        setGuest(guestData);
        setFormData({
          fullName: guestData.fullName,
          email: guestData.email,
          phone: guestData.phone,
          accommodations: guestData.accommodations,
          certificationLevel: guestData.certificationLevel,
          certificationAgency: guestData.certificationAgency,
          nitroxCertified: guestData.nitroxCertified,
          specialRequirements: guestData.specialRequirements,
          lastDiveDate: guestData.lastDiveDate,
          totalDives: guestData.totalDives,
          emergencyContact: guestData.emergencyContact,
          medicalNotes: guestData.medicalNotes,
        });
      } else {
        toast({
          title: "Guest not found",
          description: "The requested guest could not be found",
          status: "error",
          duration: 3000,
        });
        router.push('/operations/guests');
      }
    } catch (error) {
      console.error('Error loading guest:', error);
      toast({
        title: "Error loading guest",
        description: "Failed to load guest data",
        status: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle form field changes
  const handleFieldChange = (field: keyof Guest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  // Save guest
  const handleSave = async () => {
    if (!guest || !user) return;

    setSaving(true);
    try {
      // Manual edits get high priority
      await updateGuest(guestId, {
        ...formData,
        dataPriority: 'high',
        lastUpdatedBy: user.uid,
      });

      setGuest(prev => prev ? { ...prev, ...formData, dataPriority: 'high' } : null);
      setHasChanges(false);
      
      toast({
        title: "Guest updated",
        description: "Guest information has been saved with high priority",
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error saving guest:', error);
      toast({
        title: "Error saving guest",
        description: "Failed to save guest information",
        status: "error",
        duration: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete guest
  const handleDelete = async () => {
    if (!guest) return;

    try {
      await deleteGuest(guestId);
      toast({
        title: "Guest deleted",
        description: "Guest has been removed from the system",
        status: "success",
        duration: 3000,
      });
      router.push('/operations/guests');
    } catch (error) {
      console.error('Error deleting guest:', error);
      toast({
        title: "Error deleting guest",
        description: "Failed to delete guest",
        status: "error",
        duration: 3000,
      });
    }
  };

  // Navigate away with unsaved changes warning
  const handleBack = () => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        router.push('/operations/guests');
      }
    } else {
      router.push('/operations/guests');
    }
  };

  if (loading) {
    return (
      <ProtectedPage allowedRoles={['admin', 'hotel-manager', 'hotel-staff']}>
        <Box p={6}>
          <Text>Loading guest data...</Text>
        </Box>
      </ProtectedPage>
    );
  }

  if (!guest) {
    return (
      <ProtectedPage allowedRoles={['admin', 'hotel-manager', 'hotel-staff']}>
        <Box p={6}>
          <Text>Guest not found</Text>
        </Box>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage allowedRoles={['admin', 'hotel-manager', 'hotel-staff']}>
      <Box p={6} maxW="4xl">
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <HStack justify="space-between">
            <HStack spacing={4}>
              <IconButton
                icon={<FiArrowLeft />}
                aria-label="Back"
                variant="ghost"
                onClick={handleBack}
              />
              <Heading size="lg">Edit Guest</Heading>
            </HStack>
            <HStack spacing={2}>
              <Button
                leftIcon={<FiTrash2 />}
                colorScheme="red"
                variant="outline"
                onClick={onDeleteOpen}
              >
                Delete
              </Button>
              <Button
                leftIcon={<FiSave />}
                colorScheme="blue"
                onClick={handleSave}
                isLoading={saving}
                isDisabled={!hasChanges}
              >
                Save Changes
              </Button>
            </HStack>
          </HStack>

          {/* Guest Info Card */}
          <Card>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading size="md" display="flex" alignItems="center" gap={2}>
                  <FiUser />
                  Personal Information
                </Heading>
                
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Full Name</FormLabel>
                    <Input
                      value={formData.fullName || ''}
                      onChange={(e) => handleFieldChange('fullName', e.target.value)}
                      placeholder="Enter full name"
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Email</FormLabel>
                    <InputGroup>
                      <Input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                        placeholder="email@example.com"
                      />
                    </InputGroup>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Phone</FormLabel>
                    <InputGroup>
                      <Input
                        value={formData.phone || ''}
                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                      />
                    </InputGroup>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Accommodation</FormLabel>
                    <InputGroup>
                      <Input
                        value={formData.accommodations || ''}
                        onChange={(e) => handleFieldChange('accommodations', e.target.value)}
                        placeholder="Hotel or pickup location"
                      />
                    </InputGroup>
                  </FormControl>
                </SimpleGrid>
              </VStack>
            </CardBody>
          </Card>

          {/* Dive Information Card */}
          <Card>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading size="md">Dive Information</Heading>
                
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl>
                    <FormLabel>Certification Level</FormLabel>
                    <Select
                      value={formData.certificationLevel || ''}
                      onChange={(e) => handleFieldChange('certificationLevel', e.target.value)}
                      placeholder="Select certification"
                    >
                      <option value="Open Water">Open Water</option>
                      <option value="Advanced Open Water">Advanced Open Water</option>
                      <option value="Rescue Diver">Rescue Diver</option>
                      <option value="Divemaster">Divemaster</option>
                      <option value="Instructor">Instructor</option>
                    </Select>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Certification Agency</FormLabel>
                    <Input
                      value={formData.certificationAgency || ''}
                      onChange={(e) => handleFieldChange('certificationAgency', e.target.value)}
                      placeholder="PADI, SSI, NAUI, etc."
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Nitrox Certified</FormLabel>
                    <HStack>
                      <Switch
                        isChecked={formData.nitroxCertified || false}
                        onChange={(e) => handleFieldChange('nitroxCertified', e.target.checked)}
                      />
                      <Text fontSize="sm" color="textMuted">
                        Guest is certified to dive with enriched air nitrox
                      </Text>
                    </HStack>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Last Dive Date</FormLabel>
                    <Input
                      type="date"
                      value={formData.lastDiveDate || ''}
                      onChange={(e) => handleFieldChange('lastDiveDate', e.target.value)}
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Total Dives</FormLabel>
                    <Input
                      type="number"
                      value={formData.totalDives || ''}
                      onChange={(e) => handleFieldChange('totalDives', e.target.value)}
                      placeholder="Number of lifetime dives"
                    />
                  </FormControl>
                </SimpleGrid>
              </VStack>
            </CardBody>
          </Card>

          {/* Additional Information Card */}
          <Card>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading size="md">Additional Information</Heading>
                
                <FormControl>
                  <FormLabel>Emergency Contact</FormLabel>
                  <Input
                    value={formData.emergencyContact || ''}
                    onChange={(e) => handleFieldChange('emergencyContact', e.target.value)}
                    placeholder="Name and phone number"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Special Requirements</FormLabel>
                  <Textarea
                    value={formData.specialRequirements || ''}
                    onChange={(e) => handleFieldChange('specialRequirements', e.target.value)}
                    placeholder="Any special needs or requests"
                    rows={3}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Medical Notes</FormLabel>
                  <Textarea
                    value={formData.medicalNotes || ''}
                    onChange={(e) => handleFieldChange('medicalNotes', e.target.value)}
                    placeholder="Relevant medical information"
                    rows={3}
                  />
                </FormControl>
              </VStack>
            </CardBody>
          </Card>

          {/* Metadata */}
          <Card bg="gray.50">
            <CardBody>
              <VStack spacing={2} align="stretch">
                <Heading size="sm" color="textMuted">System Information</Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} fontSize="sm">
                  <Box>
                    <Text color="textMuted">Guest ID:</Text>
                    <Text fontFamily="mono">{guest.id}</Text>
                  </Box>
                  <Box>
                    <Text color="textMuted">Booking ID:</Text>
                    <Text>{guest.bookingId || 'N/A'}</Text>
                  </Box>
                  <Box>
                    <Text color="textMuted">Source:</Text>
                    <Text>{guest.source}</Text>
                  </Box>
                  <Box>
                    <Text color="textMuted">Match Status:</Text>
                    <Text>{guest.matchStatus || 'N/A'}</Text>
                  </Box>
                  <Box>
                    <Text color="textMuted">Data Priority:</Text>
                    <Badge colorScheme={
                      guest.dataPriority === 'high' ? 'green' :
                      guest.dataPriority === 'medium' ? 'yellow' : 'gray'
                    }>
                      {guest.dataPriority || 'unknown'}
                    </Badge>
                  </Box>
                  <Box>
                    <Text color="textMuted">Created:</Text>
                    <Text>{guest.createdAt?.toDate()?.toLocaleDateString()}</Text>
                  </Box>
                  <Box>
                    <Text color="textMuted">Last Updated:</Text>
                    <Text>{guest.updatedAt?.toDate()?.toLocaleDateString()}</Text>
                  </Box>
                </SimpleGrid>
              </VStack>
            </CardBody>
          </Card>
        </VStack>

        {/* Delete Confirmation Modal */}
        <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Delete Guest</ModalHeader>
            <ModalBody>
              <Alert status="warning">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold">Are you sure you want to delete this guest?</Text>
                  <Text mt={2}>
                    This action cannot be undone. All guest data will be permanently removed.
                  </Text>
                </Box>
              </Alert>
            </ModalBody>
            <ModalFooter>
              <Button variant="outline" mr={3} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDelete}>
                Delete Guest
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </ProtectedPage>
  );
}
