import { useEffect, useState } from 'react'
import {
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  HStack,
  Input,
  Select,
  VStack,
  Box,
  Heading,
  Text,
  useToast,
  useColorModeValue
} from '@chakra-ui/react'
import { getHotels } from '@/services/hotels'
import { Hotel } from '@/types/contractTypes'

interface GroupContractData {
  groupName: string
  startDate: string
  endDate: string
  hotelId: string
  bookingType: string
}

export default function GroupContractForm ({
  initialData,
  onNext,
  onCancel
}: {
  initialData?: Partial<GroupContractData>
  onNext: (data: GroupContractData) => void
  onCancel: () => void
}) {
  const toast = useToast()
  const [groupName, setGroupName] = useState(initialData?.groupName || '')
  const [startDate, setStartDate] = useState(initialData?.startDate || '')
  const [endDate, setEndDate] = useState(initialData?.endDate || '')
  const [hotelId, setHotelId] = useState(initialData?.hotelId || '')
  const [bookingType, setBookingType] = useState(initialData?.bookingType || '')

  const [hotels, setHotels] = useState<Hotel[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Theme-sensitive colors
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  useEffect(() => {
    fetchHotels()
  }, [])

  const fetchHotels = async () => {
    const hotelsData = await getHotels()
    setHotels(hotelsData)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!groupName.trim()) {
      newErrors.groupName = 'Group name is required'
    }
    if (!startDate) {
      newErrors.startDate = 'Start date is required'
    }
    if (!endDate) {
      newErrors.endDate = 'End date is required'
    }
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      newErrors.endDate = 'End date must be after start date'
    }
    if (!hotelId) {
      newErrors.hotelId = 'Hotel is required'
    }
    if (!bookingType) {
      newErrors.bookingType = 'Booking type is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields correctly.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    onNext({
      groupName,
      startDate,
      endDate,
      hotelId,
      bookingType
    })
  }

  return (
    <Box bg={cardBg} p={6} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
      <form onSubmit={handleSubmit}>
        <VStack spacing={6} align='stretch'>
          <Box>
            <Heading size="md" mb={2}>Contract Information</Heading>
            <Text color="gray.600" fontSize="sm">Enter the basic details for the group contract</Text>
          </Box>

          <VStack spacing={4} align='stretch'>
            <FormControl isRequired isInvalid={!!errors.groupName}>
              <FormLabel>Group Name</FormLabel>
              <Input
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                placeholder="Enter group name"
              />
              <FormErrorMessage>{errors.groupName}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.startDate}>
              <FormLabel>Start Date</FormLabel>
              <Input
                type='date'
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
              <FormErrorMessage>{errors.startDate}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.endDate}>
              <FormLabel>End Date</FormLabel>
              <Input
                type='date'
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
              <FormErrorMessage>{errors.endDate}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.hotelId}>
              <FormLabel>Hotel</FormLabel>
              <Select 
                value={hotelId} 
                onChange={e => setHotelId(e.target.value)}
                placeholder="Select a hotel"
              >
                {hotels.map(hotel => (
                  <option key={hotel.id} value={hotel.id}>
                    {hotel.name}
                  </option>
                ))}
              </Select>
              <FormErrorMessage>{errors.hotelId}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={!!errors.bookingType}>
              <FormLabel>Booking Type</FormLabel>
              <Select
                value={bookingType}
                onChange={e => setBookingType(e.target.value)}
                placeholder="Select booking type"
              >
                <option value='diveShop10'>Dive Shop 10%</option>
                <option value='diveShop15'>Dive Shop 15%</option>
                <option value='tourOperator20'>Tour Operator 20%</option>
                <option value='tourOperator25'>Tour Operator 25%</option>
              </Select>
              <FormErrorMessage>{errors.bookingType}</FormErrorMessage>
            </FormControl>
          </VStack>

          <HStack 
            spacing={3} 
            width={'100%'} 
            direction={{ base: 'column', md: 'row' }}
          >
            <Button 
              onClick={onCancel} 
              flex={1}
              variant="outline"
            >
              Cancel
            </Button>
            <Button 
              type='submit' 
              colorScheme='teal' 
              flex={1}
            >
              Next
            </Button>
          </HStack>
        </VStack>
      </form>
    </Box>
  )
}
