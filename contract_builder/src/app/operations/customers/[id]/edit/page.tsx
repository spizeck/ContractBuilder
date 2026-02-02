"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardBody,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  Switch,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  VStack,
  HStack,
  Text,
} from "@chakra-ui/react";
import { FiArrowLeft, FiSave } from "react-icons/fi";
import { customerService } from "@/services/customers";
import type { Customer } from "@/types/manifestTypes";
import ProtectedPage from "@/components/shared/LayoutComponents/ProtectedPage";
import { Timestamp } from "firebase/firestore";

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    emailLower: "",
    phoneE164: "",
    dateOfBirth: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    certLevel: "",
    certAgencyNumber: "",
    nitroxCertified: false,
    nitroxCertAgencyNumber: "",
    lastDiveDate: "",
    lifetimeDives: "",
  });

  useEffect(() => {
    if (params.id) {
      loadCustomer(params.id as string);
    }
  }, [params.id]);

  const loadCustomer = async (customerId: string) => {
    try {
      const customerData = await customerService.getCustomerById(customerId);
      setCustomer(customerData);
      
      // Update form data
      setFormData({
        fullName: customerData.fullName || "",
        emailLower: customerData.emailLower || "",
        phoneE164: customerData.phoneE164 || "",
        dateOfBirth: formatDateForInput(customerData.dob),
        emergencyContactName: customerData.notesGeneral || "",
        emergencyContactPhone: "",
        certLevel: customerData.certLevel || "",
        certAgencyNumber: customerData.certAgencyNumber || "",
        nitroxCertified: customerData.nitroxCertified || false,
        nitroxCertAgencyNumber: customerData.nitroxCertAgencyNumber || "",
        lastDiveDate: formatDateForInput(customerData.lastDiveDate),
        lifetimeDives: customerData.lifetimeDives?.toString() || "",
      });
    } catch (error) {
      console.error("Error loading customer:", error);
      toast({
        title: "Error",
        description: "Failed to load customer data",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (date: any): string => {
    if (!date) return '';
    
    // If it's a Firestore Timestamp
    if (date && typeof date === 'object' && 'toDate' in date) {
      return date.toDate().toISOString().split('T')[0];
    }
    
    // If it's a Date object
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    
    // If it's already a string in YYYY-MM-DD format
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return date;
    }
    
    // If it's a string in another format, try to parse it
    if (typeof date === 'string') {
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }
    }
    
    return '';
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!customer) return;
    
    setSaving(true);
    try {
      const updateData = {
        ...formData,
        lifetimeDives: formData.lifetimeDives ? parseInt(formData.lifetimeDives) || null : null,
        gearDefault: customer.gearDefault,
        gearLastUpdatedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      
      await customerService.updateCustomer(customer.id, updateData);
      
      toast({
        title: "Success",
        description: "Customer updated successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      router.back();
    } catch (error) {
      console.error("Error saving customer:", error);
      toast({
        title: "Error",
        description: "Failed to save customer data",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedPage>
        <Container maxW="container.md" py={8}>
          <Box display="flex" justifyContent="center" alignItems="center" minH="400px">
            <Spinner size="xl" />
          </Box>
        </Container>
      </ProtectedPage>
    );
  }

  if (!customer) {
    return (
      <ProtectedPage>
        <Container maxW="container.md" py={8}>
          <Alert status="error">
            <AlertIcon />
            Customer not found
          </Alert>
        </Container>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage>
      <Container maxW="container.md" py={8}>
        <Card>
          <CardBody>
            <VStack spacing={6} align="stretch">
              {/* Header */}
              <Box>
                <Heading size="lg" mb={2}>Edit Customer</Heading>
                <Button
                  leftIcon={<FiArrowLeft />}
                  variant="ghost"
                  onClick={() => router.back()}
                >
                  Back to Customer
                </Button>
              </Box>

              {/* Personal Information */}
              <Box>
                <Heading size="md" mb={4}>Personal Information</Heading>
                <VStack spacing={3}>
                  <FormControl>
                    <FormLabel>Full Name</FormLabel>
                    <Input
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      value={formData.emailLower}
                      onChange={(e) => handleInputChange('emailLower', e.target.value)}
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Phone</FormLabel>
                    <Input
                      type="tel"
                      value={formData.phoneE164}
                      onChange={(e) => handleInputChange('phoneE164', e.target.value)}
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Date of Birth</FormLabel>
                    <Input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Emergency Contact Name</FormLabel>
                    <Input
                      value={formData.emergencyContactName}
                      onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Emergency Contact Phone</FormLabel>
                    <Input
                      type="tel"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                    />
                  </FormControl>
                </VStack>
              </Box>

              {/* Certification Information */}
              <Box>
                <Heading size="md" mb={4}>Certification Information</Heading>
                <VStack spacing={3}>
                  <FormControl>
                    <FormLabel>Certification Level</FormLabel>
                    <Select
                      value={formData.certLevel}
                      onChange={(e) => handleInputChange('certLevel', e.target.value)}
                    >
                      <option value="">None</option>
                      <option value="I am not certified">I am not certified</option>
                      <option value="Scuba Diver (Requires Private Guide)">Scuba Diver (Requires Private Guide)</option>
                      <option value="Open Water (*)">Open Water (*)</option>
                      <option value="Junior Open Water">Junior Open Water</option>
                      <option value="Junior Advanced Open Water">Junior Advanced Open Water</option>
                      <option value="Advanced Open Water (**)">Advanced Open Water (**)</option>
                      <option value="Rescue (***)">Rescue (***)</option>
                      <option value="Divemaster (****)">Divemaster (****)</option>
                      <option value="Instructor">Instructor</option>
                      <option value="Snorkeler">Snorkeler</option>
                    </Select>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Certification Agency & Number</FormLabel>
                    <Input
                      value={formData.certAgencyNumber}
                      onChange={(e) => handleInputChange('certAgencyNumber', e.target.value)}
                    />
                  </FormControl>
                  
                  <FormControl display="flex" alignItems="center">
                    <FormLabel mb="0">Nitrox Certified</FormLabel>
                    <Switch
                      isChecked={formData.nitroxCertified}
                      onChange={(e) => handleInputChange('nitroxCertified', e.target.checked)}
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Nitrox Agency & Number</FormLabel>
                    <Input
                      value={formData.nitroxCertAgencyNumber}
                      onChange={(e) => handleInputChange('nitroxCertAgencyNumber', e.target.value)}
                    />
                  </FormControl>
                </VStack>
              </Box>

              {/* Equipment Requirements */}
              <Box>
                <Heading size="md" mb={4}>Equipment Requirements</Heading>
                <Text color="textMuted" mb={3}>Select which equipment the customer needs to rent</Text>
                <VStack spacing={4} align="stretch">
                  {/* BCD */}
                  <Box>
                    <HStack justify="space-between" mb={2}>
                      <FormLabel mb="0">BCD</FormLabel>
                      <Switch
                        isChecked={customer?.gearDefault?.bcd?.needRental || false}
                        onChange={(e) => {
                          const updatedGear = {
                            ...customer?.gearDefault,
                            bcd: {
                              needRental: e.target.checked,
                              sizeText: e.target.checked ? (customer?.gearDefault?.bcd?.sizeText || 'M') : '',
                              sourceText: e.target.checked ? `BCD-${customer?.gearDefault?.bcd?.sizeText || 'M'}` : ''
                            },
                            regulator: { needRental: false, sourceText: '' },
                            wetsuit: { needRental: false, sourceText: '' },
                            fins: { needRental: false, sourceText: '' },
                            mask: { needRental: false, sourceText: '' },
                            computer: { needRental: false, sourceText: '' },
                            otherNotes: customer?.gearDefault?.otherNotes || ''
                          };
                          setCustomer(prev => prev ? {...prev, gearDefault: updatedGear} : null);
                        }}
                      />
                    </HStack>
                    {customer?.gearDefault?.bcd?.needRental && (
                      <Select
                        value={customer?.gearDefault?.bcd?.sizeText || 'M'}
                        onChange={(e) => {
                          const updatedGear = {
                            ...customer?.gearDefault,
                            bcd: {
                              needRental: customer?.gearDefault?.bcd?.needRental || false,
                              sizeText: e.target.value,
                              sourceText: `BCD-${e.target.value}`
                            }
                          };
                          setCustomer(prev => prev ? {...prev, gearDefault: updatedGear} : null);
                        }}
                      >
                        <option value="ONE SIZE">One Size (Wing)</option>
                        <option value="XXS">XXS</option>
                        <option value="XS">XS</option>
                        <option value="S">Small</option>
                        <option value="M">Medium</option>
                        <option value="L">Large</option>
                        <option value="XL">XL</option>
                        <option value="XXL">XXL</option>
                      </Select>
                    )}
                  </Box>

                  {/* Wetsuit */}
                  <Box>
                    <HStack justify="space-between" mb={2}>
                      <FormLabel mb="0">Wetsuit</FormLabel>
                      <Switch
                        isChecked={customer?.gearDefault?.wetsuit?.needRental || false}
                        onChange={(e) => {
                          const updatedGear = {
                            ...customer?.gearDefault,
                            wetsuit: {
                              needRental: e.target.checked,
                              sizeText: e.target.checked ? (customer?.gearDefault?.wetsuit?.sizeText || 'M') : '',
                              sourceText: e.target.checked ? `WET-${customer?.gearDefault?.wetsuit?.sizeText || 'M'}` : ''
                            },
                            bcd: { needRental: false, sizeText: '', sourceText: '' },
                            regulator: { needRental: false, sourceText: '' },
                            fins: { needRental: false, sourceText: '' },
                            mask: { needRental: false, sourceText: '' },
                            computer: { needRental: false, sourceText: '' },
                            otherNotes: customer?.gearDefault?.otherNotes || ''
                          };
                          setCustomer(prev => prev ? {...prev, gearDefault: updatedGear} : null);
                        }}
                      />
                    </HStack>
                    {customer?.gearDefault?.wetsuit?.needRental && (
                      <Select
                        value={customer?.gearDefault?.wetsuit?.sizeText || 'M'}
                        onChange={(e) => {
                          const updatedGear = {
                            ...customer?.gearDefault,
                            wetsuit: {
                              needRental: customer?.gearDefault?.wetsuit?.needRental || false,
                              sizeText: e.target.value,
                              sourceText: `WET-${e.target.value}`
                            }
                          };
                          setCustomer(prev => prev ? {...prev, gearDefault: updatedGear} : null);
                        }}
                      >
                        <option value="XS">XS</option>
                        <option value="S">S</option>
                        <option value="M">M</option>
                        <option value="L">L</option>
                        <option value="XL">XL</option>
                        <option value="XXL">XXL</option>
                        <option value="W-XS">W - XS</option>
                        <option value="W-S">W - S</option>
                        <option value="W-M">W - M</option>
                        <option value="W-L">W - L</option>
                        <option value="W-XL">W - XL</option>
                        <option value="W-XXL">W - XXL</option>
                        <option value="M-S">M - S</option>
                        <option value="M-M">M - M</option>
                        <option value="M-L">M - L</option>
                        <option value="M-XL">M - XL</option>
                        <option value="M-XXL">M - XXL</option>
                        <option value="M-XXXL">M - XXXL</option>
                      </Select>
                    )}
                  </Box>

                  {/* Fins */}
                  <Box>
                    <HStack justify="space-between" mb={2}>
                      <FormLabel mb="0">Fins</FormLabel>
                      <Switch
                        isChecked={customer?.gearDefault?.fins?.needRental || false}
                        onChange={(e) => {
                          const updatedGear = {
                            ...customer?.gearDefault,
                            fins: {
                              needRental: e.target.checked,
                              sizeText: e.target.checked ? (customer?.gearDefault?.fins?.sizeText || 'M/L') : '',
                              sourceText: e.target.checked ? `FINS-${customer?.gearDefault?.fins?.sizeText || 'M/L'}` : ''
                            },
                            bcd: { needRental: false, sizeText: '', sourceText: '' },
                            regulator: { needRental: false, sourceText: '' },
                            wetsuit: { needRental: false, sourceText: '' },
                            mask: { needRental: false, sourceText: '' },
                            computer: { needRental: false, sourceText: '' },
                            otherNotes: customer?.gearDefault?.otherNotes || ''
                          };
                          setCustomer(prev => prev ? {...prev, gearDefault: updatedGear} : null);
                        }}
                      />
                    </HStack>
                    {customer?.gearDefault?.fins?.needRental && (
                      <Select
                        value={customer?.gearDefault?.fins?.sizeText || 'M/L'}
                        onChange={(e) => {
                          const updatedGear = {
                            ...customer?.gearDefault,
                            fins: {
                              needRental: customer?.gearDefault?.fins?.needRental || false,
                              sizeText: e.target.value,
                              sourceText: `FINS-${e.target.value}`
                            }
                          };
                          setCustomer(prev => prev ? {...prev, gearDefault: updatedGear} : null);
                        }}
                      >
                        <option value="XXS">XXS</option>
                        <option value="XS/S">XS/S</option>
                        <option value="M/L">M/L</option>
                        <option value="XL">XL</option>
                        <option value="XXL">XXL</option>
                      </Select>
                    )}
                  </Box>

                  {/* Regulator */}
                  <Box>
                    <HStack justify="space-between" mb={2}>
                      <FormLabel mb="0">Regulator</FormLabel>
                      <Switch
                        isChecked={customer?.gearDefault?.regulator?.needRental || false}
                        onChange={(e) => {
                          const updatedGear = {
                            ...customer?.gearDefault,
                            regulator: {
                              needRental: e.target.checked,
                              sourceText: e.target.checked ? 'REG-RENT' : ''
                            },
                            bcd: { needRental: false, sizeText: '', sourceText: '' },
                            wetsuit: { needRental: false, sourceText: '' },
                            fins: { needRental: false, sourceText: '' },
                            mask: { needRental: false, sourceText: '' },
                            computer: { needRental: false, sourceText: '' },
                            otherNotes: customer?.gearDefault?.otherNotes || ''
                          };
                          setCustomer(prev => prev ? {...prev, gearDefault: updatedGear} : null);
                        }}
                      />
                    </HStack>
                  </Box>

                  {/* Mask */}
                  <Box>
                    <HStack justify="space-between" mb={2}>
                      <FormLabel mb="0">Mask</FormLabel>
                      <Switch
                        isChecked={customer?.gearDefault?.mask?.needRental || false}
                        onChange={(e) => {
                          const updatedGear = {
                            ...customer?.gearDefault,
                            mask: {
                              needRental: e.target.checked,
                              sourceText: e.target.checked ? 'MASK-RENT' : ''
                            },
                            bcd: { needRental: false, sizeText: '', sourceText: '' },
                            regulator: { needRental: false, sourceText: '' },
                            wetsuit: { needRental: false, sourceText: '' },
                            fins: { needRental: false, sourceText: '' },
                            computer: { needRental: false, sourceText: '' },
                            otherNotes: customer?.gearDefault?.otherNotes || ''
                          };
                          setCustomer(prev => prev ? {...prev, gearDefault: updatedGear} : null);
                        }}
                      />
                    </HStack>
                  </Box>

                  {/* Dive Computer */}
                  <Box>
                    <HStack justify="space-between" mb={2}>
                      <FormLabel mb="0">Dive Computer</FormLabel>
                      <Switch
                        isChecked={customer?.gearDefault?.computer?.needRental || false}
                        onChange={(e) => {
                          const updatedGear = {
                            ...customer?.gearDefault,
                            computer: {
                              needRental: e.target.checked,
                              sourceText: e.target.checked ? 'COMP-RENT' : ''
                            },
                            bcd: { needRental: false, sizeText: '', sourceText: '' },
                            regulator: { needRental: false, sourceText: '' },
                            wetsuit: { needRental: false, sourceText: '' },
                            fins: { needRental: false, sourceText: '' },
                            mask: { needRental: false, sourceText: '' },
                            otherNotes: customer?.gearDefault?.otherNotes || ''
                          };
                          setCustomer(prev => prev ? {...prev, gearDefault: updatedGear} : null);
                        }}
                      />
                    </HStack>
                  </Box>
                </VStack>
              </Box>

              {/* Dive History */}
              <Box>
                <Heading size="md" mb={4}>Dive History</Heading>
                <VStack spacing={3}>
                  <FormControl>
                    <FormLabel>Last Dive Date</FormLabel>
                    <Input
                      type="date"
                      value={formData.lastDiveDate}
                      onChange={(e) => handleInputChange('lastDiveDate', e.target.value)}
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Total Lifetime Dives</FormLabel>
                    <Input
                      type="number"
                      value={formData.lifetimeDives}
                      onChange={(e) => handleInputChange('lifetimeDives', e.target.value)}
                    />
                  </FormControl>
                </VStack>
              </Box>

              {/* Save Button */}
              <Box pt={4}>
                <Button
                  leftIcon={<FiSave />}
                  colorScheme="blue"
                  onClick={handleSave}
                  isLoading={saving}
                  loadingText="Saving..."
                >
                  Save Changes
                </Button>
              </Box>
            </VStack>
          </CardBody>
        </Card>
      </Container>
    </ProtectedPage>
  );
}