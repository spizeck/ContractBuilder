import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Textarea,
  VStack,
  FormHelperText,
  Select
} from '@chakra-ui/react'
import { addHotel, updateHotel } from '@/app/app/contracts/_lib/hotelsRepo'
import { Hotel } from '@/app/app/contracts/_types'

export default function AddHotelForm ({
  editingHotel,
  onCancel,
  onSubmit
}: {
  editingHotel?: Hotel
  onCancel: () => void
  onSubmit: (updatedHotel: Hotel) => void
}) {
  const [hotelData, setHotelData] = useState({
    name: '',
    location: '',
    focRule: '',
    focBaseRate: '',
    description: '',
    contactInfo: '',
    amenities: '',
    policies: '',
    restrictions: ''
  })

  useEffect(() => {
    if (editingHotel) {
      setHotelData({
        name: editingHotel.name || '',
        location: editingHotel.location || '',
        focRule: editingHotel.focRule || '',
        focBaseRate: editingHotel.focBaseRate || '',
        description: editingHotel.description || '',
        contactInfo: editingHotel.contactInfo || '',
        amenities: editingHotel.amenities || '',
        policies: editingHotel.policies || '',
        restrictions: editingHotel.restrictions || ''
      })
    }
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
    <Box p={4} maxW='500px' mx='auto'>
      <form onSubmit={handleSubmit}>
        <VStack spacing={2} p={6} align='stretch'>
          <FormControl isRequired>
            <FormLabel>Hotel Name</FormLabel>
            <Input
              name='name'
              value={hotelData.name}
              onChange={handleInputChange}
              placeholder='Enter hotel name'
            />
            <FormHelperText>
              Enter the official name of the hotel.
            </FormHelperText>
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
            <FormHelperText>
              Choose how many guests must be paid per one free.
            </FormHelperText>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Location</FormLabel>
            <Input
              name='location'
              value={hotelData.location}
              onChange={handleInputChange}
              placeholder='Enter hotel location'
            />
            <FormHelperText>
              Enter the physical location of the hotel.
            </FormHelperText>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Description</FormLabel>
            <Textarea
              name='description'
              value={hotelData.description}
              onChange={handleInputChange}
              placeholder='Enter hotel description'
            />
            <FormHelperText>
              Provide a brief description of the hotel.
            </FormHelperText>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Contact Info</FormLabel>
            <Input
              name='contactInfo'
              value={hotelData.contactInfo}
              onChange={handleInputChange}
              placeholder='Enter contact info'
            />
            <FormHelperText>
              Provide the contact information for the hotel.
            </FormHelperText>
          </FormControl>

          <FormControl>
            <FormLabel>Amenities</FormLabel>
            <Textarea
              name='amenities'
              value={hotelData.amenities}
              onChange={handleInputChange}
              placeholder='Enter hotel amenities'
            />
            <FormHelperText>List the amenities of the hotel.</FormHelperText>
          </FormControl>

          <FormControl>
            <FormLabel>Policies</FormLabel>
            <Textarea
              name='policies'
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
              value={hotelData.restrictions}
              onChange={handleInputChange}
              placeholder='Enter hotel restrictions'
            />
            <FormHelperText>
              List any restrictions or conditions the hotel may have.
            </FormHelperText>
          </FormControl>

          <HStack spacing={4} mt={2} width={'100%'}>
            <Button type='submit' colorScheme='teal' flex={'1'}>
              {editingHotel ? 'Update Hotel' : 'Add Hotel'}
            </Button>
            <Button onClick={onCancel} colorScheme='gray' flex={'1'}>
              Cancel
            </Button>
          </HStack>
        </VStack>
      </form>
    </Box>
  )
}
