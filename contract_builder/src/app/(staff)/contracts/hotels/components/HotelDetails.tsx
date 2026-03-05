import { useState, useRef, useEffect } from 'react'
import {
  Box,
  Button,
  VStack,
  Text,
  HStack,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay
} from '@chakra-ui/react'
import AddHotelForm from './AddHotelForm'
import { deleteHotel } from '@/services/hotels'
import SeasonsList from './SeasonsList'
import RoomCategoriesList from './RoomCategoriesList'
import RoomTypesList from './RoomTypesList'
import RatesList from './RatesList'
import MealPackagesList from './MealPackagesList'
import { Hotel, RoomType } from '@/types/contractTypes'
import { getRoomTypes } from '@/services/roomTypes'
import { formatFocRule } from '@/utils/formatters'

export default function HotelDetails ({
  hotel,
  onBack
}: {
  hotel: Hotel
  onBack: () => void
}) {
  const [currentHotel, setCurrentHotel] = useState<Hotel>(hotel)
  const [isEditing, setIsEditing] = useState(false)
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [view, setView] = useState<
    | 'details'
    | 'seasons'
    | 'roomCategories'
    | 'roomTypes'
    | 'mealPackages'
    | 'rates'
  >('details')

  useEffect(() => {
    if (currentHotel.id) {
      getRoomTypes(currentHotel.id).then(setRoomTypes)
    }
  }, [currentHotel.id])

  const getFocBaseRoomName = () => {
    if (!currentHotel.focBaseRate) return 'Not set'
    const rt = roomTypes.find(r => r.id === currentHotel.focBaseRate)
    return rt ? rt.name : currentHotel.focBaseRate
  }

  // For delete confirmation dialog
  const { isOpen, onOpen, onClose } = useDisclosure()
  const cancelRef = useRef<HTMLButtonElement>(null)

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSubmitEdit = (updatedHotel: Hotel) => {
    setIsEditing(false)
    handleUpdate(updatedHotel)
  }

  const handleUpdate = (updatedHotel: Hotel) => {
    if (updatedHotel) {
      setCurrentHotel(updatedHotel)
    }
  }
  const handleDelete = async () => {
    try {
      await deleteHotel(hotel.id)
      alert('Hotel deleted successfully!')
      onBack() // Go back to the hotel list after deletion
    } catch (error) {
      console.error('Error deleting hotel:', error)
      alert('Failed to delete hotel. Please try again.')
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <AddHotelForm
        editingHotel={currentHotel}
        onCancel={handleCancelEdit}
        onSubmit={handleSubmitEdit}
      />
    )
  }

  if (view === 'seasons') {
    return (
      <SeasonsList
        hotelId={currentHotel.id}
        onBack={() => setView('details')}
      />
    )
  }

  if (view === 'roomCategories') {
    return (
      <RoomCategoriesList
        hotelId={currentHotel.id}
        onBack={() => setView('details')}
      />
    )
  }

  if (view === 'roomTypes') {
    return (
      <RoomTypesList
        hotelId={currentHotel.id}
        onBack={() => setView('details')}
      />
    )
  }

  if (view === 'mealPackages') {
    return (
      <MealPackagesList
        hotelId={currentHotel.id}
        onBack={() => setView('details')}
      />
    )
  }

  if (view === 'rates') {
    return (
      <RatesList hotelId={currentHotel.id} onBack={() => setView('details')} />
    )
  }

  return (
    <VStack spacing={4} p={5} align='stretch'>
      <Box p={5} shadow='md' borderWidth='1px'>
        <VStack align='start' spacing={2}>
          <HStack align='start'>
            <Text fontWeight='bold' minW='120px'>
              Name:
            </Text>
            <Text flex='1'>{currentHotel.name}</Text>
          </HStack>
          <HStack align='start'>
            <Text fontWeight='bold' minW='120px'>
              Location:
            </Text>
            <Text flex='1'>{currentHotel.location}</Text>
          </HStack>
          <HStack align='start'>
            <Text fontWeight='bold' minW='120px'>
              Description:
            </Text>
            <Text flex='1'>{currentHotel.description}</Text>
          </HStack>
          <HStack align='start'>
            <Text fontWeight='bold' minW='120px'>
              Contact Info:
            </Text>
            <Text flex='1'>{currentHotel.contactInfo}</Text>
          </HStack>
          <HStack align='start'>
            <Text fontWeight='bold' minW='120px'>
              Amenities:
            </Text>
            <Text flex='1'>{currentHotel.amenities}</Text>
          </HStack>
          <HStack align='start'>
            <Text fontWeight='bold' minW='120px'>
              Policies:
            </Text>
            <Text flex='1'>{currentHotel.policies}</Text>
          </HStack>
          <HStack align='start'>
            <Text fontWeight='bold' minW='120px'>
              Restrictions:
            </Text>
            <Text flex='1'>{currentHotel.restrictions}</Text>
          </HStack>
          {currentHotel.focRule && (
            <HStack align='start'>
              <Text fontWeight='bold' minW='120px'>
                FOC Rule:
              </Text>
              <Text flex='1'>{formatFocRule(currentHotel.focRule)}</Text>
            </HStack>
          )}
          {currentHotel.focBaseRate && (
            <HStack align='start'>
              <Text fontWeight='bold' minW='120px'>
                FOC Base Rate:
              </Text>
              <Text flex='1'>{getFocBaseRoomName()}</Text>
            </HStack>
          )}
          {typeof currentHotel.mealCommissionRate === 'number' && (
            <HStack align='start'>
              <Text fontWeight='bold' minW='120px'>
                Meal Commission Rate:
              </Text>
              <Text flex='1'>
                {(currentHotel.mealCommissionRate * 100).toFixed(0)}%
              </Text>
            </HStack>
          )}
        </VStack>
        <HStack spacing={4} mt={6}>
          <Button colorScheme='teal' onClick={handleEdit}>
            Edit Basic Details
          </Button>
          <Button colorScheme='red' onClick={onOpen}>
            Delete Hotel
          </Button>
        </HStack>
      </Box>

      <VStack align='stretch' spacing={4}>
        <Button colorScheme='blue' onClick={() => setView('seasons')}>
          View Seasons
        </Button>

        <Button colorScheme='blue' onClick={() => setView('roomCategories')}>
          View Room Categories
        </Button>

        <Button colorScheme='blue' onClick={() => setView('roomTypes')}>
          View Room Types
        </Button>

        <Button colorScheme='blue' onClick={() => setView('mealPackages')}>
          View Meal Packages
        </Button>

        <Button colorScheme='blue' onClick={() => setView('rates')}>
          View Rates
        </Button>
      </VStack>

      <Button colorScheme='gray' onClick={onBack}>
        Back to Hotel List
      </Button>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize='lg' fontWeight='bold'>
              Delete Hotel
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this hotel? This action cannot be
              undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme='red' onClick={handleDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </VStack>
  )
}
