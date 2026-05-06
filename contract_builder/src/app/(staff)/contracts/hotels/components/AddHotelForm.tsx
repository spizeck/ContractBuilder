import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Grid,
  Heading,
  HStack,
  Input,
  Textarea,
  VStack,
  FormHelperText,
  Select
} from '@chakra-ui/react'
import { addHotel, updateHotel } from '@/app/(staff)/contracts/_lib/hotelsRepo'
import { Hotel } from '@/app/(staff)/contracts/_types'

function getInitialHotelData(editingHotel?: Hotel | null) {
  return {
    name: editingHotel?.name ?? '',
    location: editingHotel?.location ?? '',
    focRule: editingHotel?.focRule ?? '',
    focBaseRate: editingHotel?.focBaseRate ?? '',
    description: editingHotel?.description ?? '',
    contactInfo: editingHotel?.contactInfo ?? '',
    amenities: editingHotel?.amenities ?? '',
    policies: editingHotel?.policies ?? '',
    restrictions: editingHotel?.restrictions ?? '',
    operationalNotes: editingHotel?.operationalNotes ?? '',
    cancellationPolicy: editingHotel?.cancellationPolicy ?? '',
    paymentTerms: editingHotel?.paymentTerms ?? '',
    forceMajeure: editingHotel?.forceMajeure ?? '',
    travelInsurance: editingHotel?.travelInsurance ?? '',
    fitnessToDive: editingHotel?.fitnessToDive ?? '',
    unusedServices: editingHotel?.unusedServices ?? '',
  }
}

export default function AddHotelForm ({
  editingHotel,
  onCancel,
  onSubmit
}: {
  editingHotel?: Hotel
  onCancel: () => void
  onSubmit: (updatedHotel: Hotel) => void
}) {
  const [hotelData, setHotelData] = useState(() => getInitialHotelData(editingHotel))

  useEffect(() => {
    setHotelData(getInitialHotelData(editingHotel))
  }, [editingHotel])

  interface FocRuleSelectProps {
    focRule: string // e.g., "7+1"
    setFocRule: (focRule: string) => void
  }

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setHotelData({
      ...hotelData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      if (editingHotel) {
        await updateHotel(editingHotel.id, hotelData)
        alert('Hotel updated successfully!')
        onSubmit({ id: editingHotel.id, ...hotelData })
      } else {
        const newHotelId = await addHotel(hotelData)
        alert('Hotel added successfully!')
        onSubmit({ id: newHotelId as string, ...hotelData })
      }
    } catch (error) {
      console.error('Error saving hotel:', error)
      alert('Failed to save hotel. Please try again.')
    }
  }

  return (
    <Box p={6} maxW='1100px' mx='auto' w='100%'>
      <form onSubmit={handleSubmit}>
        <VStack spacing={8} align='stretch'>

          {/* ── Basic Info ── */}
          <Box>
            <Heading as='h3' size='sm' mb={4} textTransform='uppercase' letterSpacing='wide' color='teal.400'>
              Basic Information
            </Heading>
            <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
              <FormControl isRequired>
                <FormLabel>Hotel Name</FormLabel>
                <Input
                  name='name'
                  value={hotelData.name}
                  onChange={handleInputChange}
                  placeholder='Enter hotel name'
                />
                <FormHelperText>Enter the official name of the hotel.</FormHelperText>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Location</FormLabel>
                <Input
                  name='location'
                  value={hotelData.location}
                  onChange={handleInputChange}
                  placeholder='Enter hotel location'
                />
                <FormHelperText>Enter the physical location of the hotel.</FormHelperText>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Contact Info</FormLabel>
                <Input
                  name='contactInfo'
                  value={hotelData.contactInfo}
                  onChange={handleInputChange}
                  placeholder='Enter contact info'
                />
                <FormHelperText>Provide the contact information for the hotel.</FormHelperText>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>FOC Rule</FormLabel>
                <Select
                  name='focRule'
                  value={hotelData.focRule}
                  onChange={handleInputChange}
                  placeholder='Select FOC Rule'
                >
                  {Array.from({ length: 6 }, (_, i) => {
                    const paid = i + 4
                    return (
                      <option key={paid} value={`${paid}+1`}>
                        {paid} paid, 1 free
                      </option>
                    )
                  })}
                </Select>
                <FormHelperText>Choose how many guests must be paid per one free.</FormHelperText>
              </FormControl>
            </Grid>

            <Grid templateColumns='1fr' gap={4} mt={4}>
              <FormControl isRequired>
                <FormLabel>Description</FormLabel>
                <Textarea
                  name='description'
                  rows={4}
                  value={hotelData.description}
                  onChange={handleInputChange}
                  placeholder='Enter hotel description'
                />
                <FormHelperText>Provide a brief description of the hotel.</FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>Amenities</FormLabel>
                <Textarea
                  name='amenities'
                  rows={3}
                  value={hotelData.amenities}
                  onChange={handleInputChange}
                  placeholder='Enter hotel amenities'
                />
                <FormHelperText>List the amenities of the hotel.</FormHelperText>
              </FormControl>
            </Grid>
          </Box>

          {/* ── Policies & Restrictions ── */}
          <Box>
            <Heading as='h3' size='sm' mb={4} textTransform='uppercase' letterSpacing='wide' color='teal.400'>
              Policies &amp; Restrictions
            </Heading>
            <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={4}>
              <FormControl>
                <FormLabel>Hotel Policies</FormLabel>
                <Textarea
                  name='policies'
                  rows={6}
                  value={hotelData.policies}
                  onChange={handleInputChange}
                  placeholder='Enter hotel policies'
                />
                <FormHelperText>List the policies of the hotel.</FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>Restrictions</FormLabel>
                <Textarea
                  name='restrictions'
                  rows={6}
                  value={hotelData.restrictions}
                  onChange={handleInputChange}
                  placeholder='Enter hotel restrictions'
                />
                <FormHelperText>List any restrictions or conditions the hotel may have.</FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>Operational Notes</FormLabel>
                <Textarea
                  name='operationalNotes'
                  rows={6}
                  value={hotelData.operationalNotes}
                  onChange={handleInputChange}
                  placeholder='Airport transfers, ferry coordination, dive requirements, arrival recommendations, Nitrox policies, luggage notes, restaurant closures, operational scheduling notes, etc.'
                />
                <FormHelperText>Internal operational notes for this hotel.</FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>Cancellation Policy</FormLabel>
                <Textarea
                  name='cancellationPolicy'
                  rows={6}
                  value={hotelData.cancellationPolicy}
                  onChange={handleInputChange}
                  placeholder='e.g., 50% refund if cancelled 30+ days before arrival. No refund within 30 days.'
                />
                <FormHelperText>Specify cancellation and refund terms for this hotel.</FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>Payment Terms</FormLabel>
                <Textarea
                  name='paymentTerms'
                  rows={6}
                  value={hotelData.paymentTerms}
                  onChange={handleInputChange}
                  placeholder='e.g., 50% deposit due within 14 days of booking. Balance due 30 days before arrival.'
                />
                <FormHelperText>Specify payment schedule, deposit requirements, and due dates.</FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>Force Majeure</FormLabel>
                <Textarea
                  name='forceMajeure'
                  rows={6}
                  value={hotelData.forceMajeure}
                  onChange={handleInputChange}
                  placeholder='e.g., Neither party shall be liable for failure to perform due to events beyond their reasonable control...'
                />
                <FormHelperText>Force majeure clause covering extraordinary events.</FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>Travel Insurance</FormLabel>
                <Textarea
                  name='travelInsurance'
                  rows={6}
                  value={hotelData.travelInsurance}
                  onChange={handleInputChange}
                  placeholder='e.g., Travel insurance is strongly recommended for all guests...'
                />
                <FormHelperText>Travel insurance requirements or recommendations.</FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>Fitness to Dive</FormLabel>
                <Textarea
                  name='fitnessToDive'
                  rows={6}
                  value={hotelData.fitnessToDive}
                  onChange={handleInputChange}
                  placeholder='e.g., All divers must be medically fit. A dive medical may be required...'
                />
                <FormHelperText>Fitness to dive requirements and medical disclaimers.</FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>Unused Services</FormLabel>
                <Textarea
                  name='unusedServices'
                  rows={6}
                  value={hotelData.unusedServices}
                  onChange={handleInputChange}
                  placeholder='e.g., No refund or credit will be given for unused services or forfeited nights...'
                />
                <FormHelperText>Policy on unused or forfeited services.</FormHelperText>
              </FormControl>
            </Grid>
          </Box>

          <HStack spacing={4} mt={2}>
            <Button type='submit' colorScheme='teal' size='lg' px={10}>
              {editingHotel ? 'Update Hotel' : 'Add Hotel'}
            </Button>
            <Button onClick={onCancel} colorScheme='gray' size='lg' px={10}>
              Cancel
            </Button>
          </HStack>

        </VStack>
      </form>
    </Box>
  )
}
