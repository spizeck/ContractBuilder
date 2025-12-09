'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getHotelByStaffId, updateHotelDetails } from '@/services/hotelStaff'
import { Hotel } from '@/types/contractTypes'
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Textarea,
  FormControl,
  FormLabel,
  FormHelperText,
  Spinner,
  Icon,
  SimpleGrid
} from '@chakra-ui/react'
import { ArrowLeft, Save, Hotel as HotelIcon } from 'lucide-react'
import Link from 'next/link'

export default function HotelDetailsPage() {
  const { user, role, loading } = useAuth()
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [formData, setFormData] = useState<Partial<Hotel>>({})
  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!loading && user && (role === 'staff' || role === 'manager')) {
      loadHotelData()
    } else if (!loading && !user) {
      // Redirect to login if not authenticated
      window.location.href = '/login?redirect=/hotel-staff/hotel'
    } else if (!loading && user && role !== 'staff' && role !== 'manager') {
      // Redirect to dashboard if wrong role
      window.location.href = '/'
    }
  }, [user, role, loading])

  const loadHotelData = async () => {
    if (!user) return

    try {
      setLoadingData(true)
      const hotelData = await getHotelByStaffId(user.uid)
      if (hotelData) {
        setHotel(hotelData)
        setFormData(hotelData)
      }
    } catch (error) {
      console.error('Error loading hotel data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleInputChange = (field: keyof Hotel, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    if (!user || !hotel) return

    try {
      setSaving(true)
      const success = await updateHotelDetails(user.uid, hotel.id, formData)
      
      if (success) {
        alert('Hotel details updated successfully')
        // Reload data to get updated values
        await loadHotelData()
      } else {
        alert('Failed to update hotel details')
      }
    } catch (error) {
      console.error('Error saving hotel details:', error)
      alert('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (loading || loadingData) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minH="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="info" thickness="4px" />
          <Text color="textSecondary">Loading hotel details...</Text>
        </VStack>
      </Box>
    )
  }

  if (!user || (role !== 'staff' && role !== 'manager')) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minH="100vh">
        <Card maxW="md">
          <CardHeader>
            <Heading size="md" color="error" textAlign="center">Access Denied</Heading>
          </CardHeader>
          <CardBody>
            <Text textAlign="center" color="textSecondary">
              You don't have permission to access hotel management.
            </Text>
          </CardBody>
        </Card>
      </Box>
    )
  }

  if (!hotel) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minH="100vh">
        <Card maxW="md">
          <CardHeader>
            <Heading size="md" color="warning" textAlign="center">No Hotel Assigned</Heading>
          </CardHeader>
          <CardBody>
            <Text textAlign="center" color="textSecondary">
              You haven't been assigned to a hotel yet. Please contact your administrator.
            </Text>
          </CardBody>
        </Card>
      </Box>
    )
  }

  return (
    <Box maxW="6xl" mx="auto" px={4} py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <HStack mb={4}>
            <Link href="/hotel-staff">
              <Button variant="ghost" mr={4}>
                <Icon as={ArrowLeft} h={4} w={4} mr={2} />
                Back to Dashboard
              </Button>
            </Link>
            <HStack>
              <Icon as={HotelIcon} h={8} w={8} color="info" mr={3} />
              <VStack align="start" spacing={1}>
                <Heading size="xl" color="textPrimary">Hotel Details</Heading>
                <Text color="textSecondary">Edit your hotel information</Text>
              </VStack>
            </HStack>
          </HStack>
        </Box>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
          <Card>
            <CardHeader>
              <Heading size="md">Basic Information</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Hotel Name</FormLabel>
                  <Input
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter hotel name"
                  />
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>Location</FormLabel>
                  <Input
                    value={formData.location || ''}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Enter hotel location"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Contact Information</FormLabel>
                  <Textarea
                    value={formData.contactInfo || ''}
                    onChange={(e) => handleInputChange('contactInfo', e.target.value)}
                    placeholder="Enter contact details (phone, email, address)"
                    rows={3}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    value={formData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter hotel description"
                    rows={4}
                  />
                </FormControl>
              </VStack>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <Heading size="md">Policies & Services</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Amenities</FormLabel>
                  <Textarea
                    value={formData.amenities || ''}
                    onChange={(e) => handleInputChange('amenities', e.target.value)}
                    placeholder="List hotel amenities (one per line or comma-separated)"
                    rows={4}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Hotel Policies</FormLabel>
                  <Textarea
                    value={formData.policies || ''}
                    onChange={(e) => handleInputChange('policies', e.target.value)}
                    placeholder="Enter hotel policies and rules"
                    rows={4}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Restrictions</FormLabel>
                  <Textarea
                    value={formData.restrictions || ''}
                    onChange={(e) => handleInputChange('restrictions', e.target.value)}
                    placeholder="Enter any restrictions or special requirements"
                    rows={3}
                  />
                </FormControl>
              </VStack>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <Heading size="md">Commission & FOC Rules</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Free of Charge Rule</FormLabel>
                  <Input
                    value={formData.focRule || ''}
                    onChange={(e) => handleInputChange('focRule', e.target.value)}
                    placeholder="e.g., 7+1, 10+1"
                  />
                  <FormHelperText>
                    Format: X+Y (Y free for every X paying guests)
                  </FormHelperText>
                </FormControl>

                <FormControl>
                  <FormLabel>FOC Base Room Type</FormLabel>
                  <Input
                    value={formData.focBaseRate || ''}
                    onChange={(e) => handleInputChange('focBaseRate', e.target.value)}
                    placeholder="Base room type for FOC calculation"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Meal Commission Rate (%)</FormLabel>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.mealCommissionRate || ''}
                    onChange={(e) => handleInputChange('mealCommissionRate', e.target.value)}
                    placeholder="e.g., 10 for 10%"
                  />
                  <FormHelperText>
                    Enter percentage (e.g., 10 for 10% commission)
                  </FormHelperText>
                </FormControl>
              </VStack>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <Heading size="md">Actions</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4}>
                <Button 
                  onClick={handleSave} 
                  isLoading={saving}
                  loadingText="Saving..."
                  w="full"
                  colorScheme="teal"
                >
                  <Icon as={Save} h={4} w={4} mr={2} />
                  Save Changes
                </Button>
                
                <Link href="/hotel-staff">
                  <Button w="full" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>
      </VStack>
    </Box>
  )
}
