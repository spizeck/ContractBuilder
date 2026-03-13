'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@core/auth/AuthContext'
import { getHotelByStaffId, updateHotelDetails } from '@/app/(staff)/contracts/_lib/hotelStaffRepo'
import { Hotel } from '@/app/(staff)/contracts/_types'
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
  SimpleGrid,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Select,
  NumberInput,
  NumberInputField,
} from '@chakra-ui/react'
import { ArrowLeft, Save, Hotel as HotelIcon } from 'lucide-react'
import Link from 'next/link'
import RoomCategoriesList from '@/app/(staff)/contracts/hotels/components/RoomCategoriesList'
import RoomTypesList from '@/app/(staff)/contracts/hotels/components/RoomTypesList'
import SeasonsList from '@/app/(staff)/contracts/hotels/components/SeasonsList'
import RatesList from '@/app/(staff)/contracts/hotels/components/RatesList'
import MealPackagesList from '@/app/(staff)/contracts/hotels/components/MealPackagesList'
import LogoUpload from '@/app/(staff)/contracts/hotels/components/LogoUpload'
import { getRoomTypes } from '@/app/(staff)/contracts/_lib/roomTypesRepo'
import { RoomType } from '@/app/(staff)/contracts/_types'

export default function HotelDetailsPage() {
  const { user, role, loading } = useAuth()
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [formData, setFormData] = useState<Partial<Hotel>>({})
  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])

  useEffect(() => {
    if (!loading && user && (role === 'hotel-staff' || role === 'hotel-manager')) {
      loadHotelData()
    } else if (!loading && !user) {
      window.location.href = '/login?redirect=/contracts/hotel-staff/hotel'
    } else if (!loading && user && role !== 'hotel-staff' && role !== 'hotel-manager') {
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
        // Load room types for the dropdown
        const roomTypesData = await getRoomTypes(hotelData.id)
        setRoomTypes(roomTypesData)
      }
    } catch (error) {
      console.error('Error loading hotel data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleInputChange = (field: keyof Hotel, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!user || !hotel) return
    try {
      setSaving(true)
      setSaveSuccess(false)
      const success = await updateHotelDetails(user.uid, hotel.id, formData)
      if (success) {
        setSaveSuccess(true)
        await loadHotelData()
        setTimeout(() => setSaveSuccess(false), 3000)
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

  if (!user || (role !== 'hotel-staff' && role !== 'hotel-manager')) {
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
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <HStack mb={4}>
            <Link href="/contracts/hotel-staff">
              <Button variant="ghost" mr={4}>
                <Icon as={ArrowLeft} h={4} w={4} mr={2} />
                Back to Dashboard
              </Button>
            </Link>
            <HStack>
              <Icon as={HotelIcon} h={8} w={8} color="info" mr={3} />
              <VStack align="start" spacing={0}>
                <Heading size="xl" color="textPrimary">{hotel.name}</Heading>
                <Text color="textSecondary">Manage hotel details, rooms, seasons &amp; rates</Text>
              </VStack>
            </HStack>
          </HStack>
        </Box>

        {/* Tabbed sections */}
        <Tabs variant="enclosed" colorScheme="teal">
          <TabList>
            <Tab>Hotel Details</Tab>
            <Tab>Room Categories</Tab>
            <Tab>Room Types</Tab>
            <Tab>Seasons</Tab>
            <Tab>Rates</Tab>
            <Tab>Meal Packages</Tab>
          </TabList>

          <TabPanels>
            {/* ── Hotel Details ── */}
            <TabPanel px={0} pt={6}>
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
                <Card>
                  <CardHeader><Heading size="md">Basic Information</Heading></CardHeader>
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
                  <CardHeader><Heading size="md">Policies &amp; Services</Heading></CardHeader>
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
                  <CardHeader><Heading size="md">Branding</Heading></CardHeader>
                  <CardBody>
                    <VStack spacing={4}>
                      {hotel && (
                        <LogoUpload
                          hotelId={hotel.id}
                          currentLogoUrl={formData.logoUrl}
                          onLogoChange={(url) => handleInputChange('logoUrl', url || '')}
                        />
                      )}
                    </VStack>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader><Heading size="md">Commission &amp; FOC Rules</Heading></CardHeader>
                  <CardBody>
                    <VStack spacing={4}>
                      <FormControl>
                        <FormLabel>Free of Charge Rule</FormLabel>
                        <Select
                          value={formData.focRule || ''}
                          onChange={(e) => handleInputChange('focRule', e.target.value)}
                          placeholder="Select FOC rule"
                        >
                          <option value="4+1">4+1</option>
                          <option value="5+1">5+1</option>
                          <option value="6+1">6+1</option>
                          <option value="7+1">7+1</option>
                          <option value="8+1">8+1</option>
                          <option value="9+1">9+1</option>
                          <option value="10+1">10+1</option>
                        </Select>
                        <FormHelperText>Format: X+Y (Y free for every X paying guests)</FormHelperText>
                      </FormControl>
                      <FormControl>
                        <FormLabel>FOC Base Room Type</FormLabel>
                        <Select
                          value={formData.focBaseRate || ''}
                          onChange={(e) => handleInputChange('focBaseRate', e.target.value)}
                          placeholder="Select base room type"
                        >
                          {roomTypes.map((roomType) => (
                            <option key={roomType.id} value={roomType.id}>
                              {roomType.name}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Meal Commission Rate (%)</FormLabel>
                        <Select
                          value={
                            formData.mealCommissionRate !== undefined &&
                            formData.mealCommissionRate !== null &&
                            [0, 0.05, 0.1, 0.15, 0.2].includes(Number(formData.mealCommissionRate))
                              ? String(formData.mealCommissionRate)
                              : formData.mealCommissionRate !== undefined && formData.mealCommissionRate !== null
                              ? 'other'
                              : ''
                          }
                          onChange={(e) => {
                            const value = e.target.value
                            if (value !== 'other') {
                              setFormData(prev => ({ ...prev, mealCommissionRate: Number(value) }))
                            }
                          }}
                          placeholder="Select commission rate"
                        >
                          <option value="0">0%</option>
                          <option value="0.05">5%</option>
                          <option value="0.1">10%</option>
                          <option value="0.15">15%</option>
                          <option value="0.2">20%</option>
                          <option value="other">Other</option>
                        </Select>
                        {formData.mealCommissionRate !== undefined &&
                          formData.mealCommissionRate !== null &&
                          ![0, 0.05, 0.1, 0.15, 0.2].includes(Number(formData.mealCommissionRate)) && (
                            <NumberInput
                              mt={2}
                              value={Number(formData.mealCommissionRate) * 100}
                              onChange={(valueString) => {
                                const percentageValue = parseFloat(valueString) || 0
                                const decimalValue = percentageValue / 100
                                setFormData(prev => ({ ...prev, mealCommissionRate: decimalValue }))
                              }}
                              min={0}
                              max={100}
                              precision={2}
                            >
                              <NumberInputField placeholder="Enter custom commission rate (%)" />
                            </NumberInput>
                          )}
                        <FormHelperText>Select a standard rate or choose Other to enter a custom percentage</FormHelperText>
                      </FormControl>
                    </VStack>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader><Heading size="md">Actions</Heading></CardHeader>
                  <CardBody>
                    <VStack spacing={4}>
                      {saveSuccess && (
                        <Text color="green.500" fontWeight="medium">
                          Hotel details saved successfully!
                        </Text>
                      )}
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
                      <Link href="/contracts/hotel-staff" style={{ width: '100%' }}>
                        <Button w="full" variant="outline" colorScheme="gray">Cancel</Button>
                      </Link>
                    </VStack>
                  </CardBody>
                </Card>
              </SimpleGrid>
            </TabPanel>

            {/* ── Room Categories ── */}
            <TabPanel px={0} pt={6}>
              <RoomCategoriesList hotelId={hotel.id} onBack={() => {}} />
            </TabPanel>

            {/* ── Room Types ── */}
            <TabPanel px={0} pt={6}>
              <RoomTypesList hotelId={hotel.id} onBack={() => {}} />
            </TabPanel>

            {/* ── Seasons ── */}
            <TabPanel px={0} pt={6}>
              <SeasonsList hotelId={hotel.id} onBack={() => {}} />
            </TabPanel>

            {/* ── Rates ── */}
            <TabPanel px={0} pt={6}>
              <RatesList hotelId={hotel.id} onBack={() => {}} />
            </TabPanel>

            {/* ── Meal Packages ── */}
            <TabPanel px={0} pt={6}>
              <MealPackagesList hotelId={hotel.id} onBack={() => {}} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  )
}
