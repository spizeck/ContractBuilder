import { useEffect, useState } from 'react'
import {
  Button,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Stack,
  Text,
  VStack,
  Box,
  Heading,
  useToast,
} from '@chakra-ui/react'
import { ChevronDownIcon } from '@chakra-ui/icons'
import { getRoomCategories } from '@/services/roomCategories'
import { getRates } from '@/services/rates'
import { getSeasons } from '@/services/seasons'
import { parseDateStringAsUTC } from '@/utils/dateUtils'
import { getRoomTypes } from '@/services/roomTypes'
import { Rate, RoomCategory, RoomType, Season } from '@/types/contractTypes'

interface RoomSelection {
  categoryId: string
  occupancyType: string
  numRooms: number
}

export default function RoomSelectionForm ({
  hotelId,
  startDate,
  endDate,
  onNext,
  onBack,
  onCancel,
  initialRooms = []
}: {
  hotelId: string
  startDate: string
  endDate: string
  onNext: (data: { rooms: RoomSelection[] }) => void
  onBack: () => void
  onCancel: () => void
  initialRooms?: RoomSelection[]
}) {
  const toast = useToast()
  const [roomCategories, setRoomCategories] = useState<RoomCategory[]>([])
  const [rates, setRates] = useState<Rate[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [roomSelections, setRoomSelections] =
    useState<RoomSelection[]>(initialRooms)
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null)
  const [seasonCheckDone, setSeasonCheckDone] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Color values now come from semantic tokens in theme

  useEffect(() => {
    const fetchData = async () => {
      const [categoriesData, ratesData, seasonsData, roomTypesData] =
        await Promise.all([
          getRoomCategories(hotelId),
          getRates(hotelId),
          getSeasons(hotelId),
          getRoomTypes(hotelId)
        ])
      setRoomCategories(categoriesData)
      setRates(ratesData)
      setSeasons(seasonsData)
      setRoomTypes(roomTypesData)
    }

    fetchData()
  }, [hotelId])

  useEffect(() => {
    if (seasons.length === 0) return

    const getSeasonWithMostOverlap = () => {
      const contractStart = parseDateStringAsUTC(startDate)
      const contractEnd = parseDateStringAsUTC(endDate)

      let bestSeason: Season | null = null
      let maxOverlapDays = 0

      for (const season of seasons) {
        const seasonStart = parseDateStringAsUTC(season.startDate)
        const seasonEnd = parseDateStringAsUTC(season.endDate)

        const overlapStart =
          contractStart > seasonStart ? contractStart : seasonStart
        const overlapEnd = contractEnd < seasonEnd ? contractEnd : seasonEnd

        const overlapMs = overlapEnd.getTime() - overlapStart.getTime()
        const overlapDays = Math.max(
          0,
          Math.ceil(overlapMs / (1000 * 60 * 60 * 24))
        )

        if (overlapDays > maxOverlapDays) {
          maxOverlapDays = overlapDays
          bestSeason = season
        }
      }

      return bestSeason
    }

    const bestSeason = getSeasonWithMostOverlap()
    if (bestSeason) {
      setSeasonCheckDone(true)
      setSelectedSeason(bestSeason)
    } else {
      alert('No seasons found for the selected date range...')
      onBack()
    }
  }, [seasons, startDate, endDate, onBack])

  const availableCategoryIds = rates
    .filter(rate => rate.seasonId === selectedSeason?.id)
    .map(rate => rate.categoryId)

  const filteredRoomCategories = roomCategories.filter(category =>
    availableCategoryIds.includes(category.id)
  )

  const addRoomSelection = () => {
    setRoomSelections([
      ...roomSelections,
      { categoryId: '', occupancyType: '', numRooms: 0 }
    ])
  }

  const removeRoomSelection = (index: number) => {
    const updatedSelections = [...roomSelections]
    updatedSelections.splice(index, 1)
    setRoomSelections(updatedSelections)
  }

  const updateRoomSelection = (index: number, field: string, value: any) => {
    const updatedSelections = [...roomSelections]

    updatedSelections[index] = {
      ...updatedSelections[index],
      [field]: field === 'numRooms' ? parseInt(value) || 0 : value
    }

    setRoomSelections(updatedSelections)
  }

  const handleSubmit = () => {
    const roomTypeQuantities: { [key: string]: number } = {}

    roomSelections.forEach(sel => {
      const key = `${sel.categoryId}-${sel.occupancyType}`
      roomTypeQuantities[key] = (roomTypeQuantities[key] || 0) + sel.numRooms
    })

    const hasInvalidSelection = roomSelections.some(
      sel => !sel.categoryId || !sel.occupancyType || sel.numRooms <= 0
    )

    if (hasInvalidSelection) {
      toast({
        title: 'Validation Error',
        description: 'Please complete all room selections before proceeding.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    for (const key in roomTypeQuantities) {
      const [categoryId, occupancyType] = key.split('-')
      const matched = roomTypes.find(
        (rt: RoomType) =>
          rt.categoryId === categoryId && rt.name === occupancyType
      )
      if (matched && roomTypeQuantities[key] > matched.quantity) {
        toast({
          title: 'Availability Error',
          description: `You requested ${roomTypeQuantities[key]} rooms for ${occupancyType}, but only ${matched.quantity} are available.`,
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
        return
      }
    }
    onNext({ rooms: roomSelections })
  }

  if (!seasonCheckDone) {
    return <Text>Checking seasons...</Text>
  }

  return (
    <Box bg="cardBg" p={4} borderWidth="1px" borderColor="border">
      <VStack spacing={6} align='stretch'>
        <Box>
          <Heading size="md" mb={2}>Room Selection</Heading>
          <Text color="textPrimary" fontSize="sm">Select room categories and quantities for the contract</Text>
        </Box>

        <VStack spacing={4} align='stretch'>
          <HStack justifyContent='space-between'>
            <Text fontSize='lg' fontWeight='bold'>
              Select Rooms
            </Text>
            <Button
              colorScheme='red'
              onClick={() => {
                if (
                  window.confirm('All progress will be discarded. Are you sure?')
                ) {
                  onCancel()
                }
              }}
            >
              Cancel
        </Button>
      </HStack>
      {roomSelections.map((selection, index) => (
        <Stack
          key={index}
          spacing={3}
          direction={{ base: 'column', md: 'row' }}
          borderWidth='1px'
          borderRadius='md'
          p={3}
        >
          {/* Room Category */}
          <FormControl isRequired>
            <FormLabel>Room Category</FormLabel>
            <Menu>
              <MenuButton as={Button} rightIcon={<ChevronDownIcon />} w='100%'>
                {selection.categoryId
                  ? filteredRoomCategories.find(
                      c => c.id === selection.categoryId
                    )?.name
                  : 'Select a category'}
              </MenuButton>
              <MenuList maxHeight='500px' overflowY='auto'>
                {filteredRoomCategories.map(category => (
                  <MenuItem
                    key={category.id}
                    onClick={() =>
                      updateRoomSelection(index, 'categoryId', category.id)
                    }
                  >
                    {category.name}
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>
          </FormControl>

          {/* Occupancy Type */}
          <FormControl isRequired>
            <FormLabel>Occupancy Type</FormLabel>
            <Menu>
              <MenuButton
                as={Button}
                rightIcon={<ChevronDownIcon />}
                w='100%'
                isDisabled={!selection.categoryId}
              >
                {selection.occupancyType || 'Select occupancy'}
              </MenuButton>
              <MenuList maxHeight='500px' overflowY='auto'>
                {(() => {
                  const occupancyOrder = ['Single', 'Double', 'Triple', 'Quad']
                  return rates
                    .filter(
                      rate =>
                        rate.seasonId === selectedSeason?.id &&
                        rate.categoryId === selection.categoryId
                    )
                    .map(rate => rate.occupancyType)
                    .filter((value, idx, self) => self.indexOf(value) === idx)
                    .sort((a, b) => {
                      const indexA = occupancyOrder.indexOf(a)
                      const indexB = occupancyOrder.indexOf(b)
                      return (
                        (indexA === -1 ? 99 : indexA) -
                        (indexB === -1 ? 99 : indexB)
                      )
                    })
                    .map(type => (
                      <MenuItem
                        key={type}
                        onClick={() =>
                          updateRoomSelection(index, 'occupancyType', type)
                        }
                      >
                        {type}
                      </MenuItem>
                    ))
                })()}
              </MenuList>
            </Menu>
          </FormControl>

          {/* Number of Rooms */}
          <FormControl isRequired>
            <FormLabel>Number of Rooms</FormLabel>
            <Input
              type='number'
              value={selection.numRooms}
              onChange={e =>
                updateRoomSelection(index, 'numRooms', e.target.value)
              }
            />
          </FormControl>

          {/* Remove Button */}
          <Button
            onClick={() => removeRoomSelection(index)}
            colorScheme='red'
            alignSelf={{ base: 'center', md: 'flex-end' }}
            size={{ base: 'sm', md: 'md' }}
            w={{ base: '100%', md: 'auto' }}
          >
            X
          </Button>
        </Stack>
      ))}

      <Button
        onClick={addRoomSelection}
        colorScheme='blue'
        w={{ base: '100%', md: 'auto' }}
      >
        Add Another Room
      </Button>

      <HStack 
        spacing={3} 
        w='100%'
        direction={{ base: 'column', md: 'row' }}
      >
        <Button 
          onClick={onBack} 
          flex={1}
          variant="outline"
        >
          Back
        </Button>
        <Button 
          onClick={handleSubmit} 
          colorScheme='teal' 
          flex={1}
        >
          Next
        </Button>
      </HStack>
    </VStack>
  </VStack>
</Box>
)
}
