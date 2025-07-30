import { useState, useEffect } from 'react'
import {
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Select,
  Input,
  Button,
  Text
} from '@chakra-ui/react'
import { getRoomCategories } from '@/services/roomCategories'
import { getRates } from '@/services/rates'
import { getSeasons } from '@/services/seasons'
import { parseDateStringAsUTC } from '@/utils/dateUtils'
import { Rate, RoomCategory, Season } from '@/types'

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
  onBack
}: {
  hotelId: string
  startDate: string
  endDate: string
  onNext: (data: { rooms: RoomSelection[] }) => void
  onBack: () => void
}) {
  const [roomCategories, setRoomCategories] = useState<RoomCategory[]>([])
  const [rates, setRates] = useState<Rate[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [roomSelections, setRoomSelections] = useState<RoomSelection[]>([])
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null)
  const [seasonCheckDone, setSeasonCheckDone] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const [categoriesData, ratesData, seasonsData] = await Promise.all([
      getRoomCategories(hotelId),
      getRates(hotelId),
      getSeasons(hotelId)
    ])
    setRoomCategories(categoriesData)
    setRates(ratesData)
    setSeasons(seasonsData)
  }

  const getSeasonWithMostOverlap = () => {
    const contractStart = parseDateStringAsUTC(startDate)
    const contractEnd = parseDateStringAsUTC(endDate)

    let bestSeason: Season | null = null
    let maxOverlapDays = 0

    for (const season of seasons) {
      const seasonStart = parseDateStringAsUTC(season.startDate)
      const seasonEnd = parseDateStringAsUTC(season.endDate)

      // Find overlap range
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

  useEffect(() => {
    if (seasons.length === 0) return

    // Determine applicable seasons based on date range
    const bestSeason = getSeasonWithMostOverlap()

    if (bestSeason) {
      setSeasonCheckDone(true)
      setSelectedSeason(bestSeason) // optionally store it in state if needed
    } else {
      alert('No seasons found for the selected date range...')
      onBack()
    }
  }, [seasons, startDate, endDate, onBack])

  const occupancyTypes = ['Single', 'Double', 'Triple', 'Quad']

  const addRoomSelection = () => {
    setRoomSelections([
      ...roomSelections,
      { categoryId: '', occupancyType: '', numRooms: 0 }
    ])
  }

  const updateRoomSelection = (index: number, field: string, value: any) => {
    const updatedSelections = [...roomSelections]
    updatedSelections[index] = {
      ...updatedSelections[index],
      [field]: field === 'numRooms' ? parseInt(value) : value
    }
    setRoomSelections(updatedSelections)
  }

  const handleSubmit = () => {
    // Validate selections

    onNext({ rooms: roomSelections })
  }

  if (!seasonCheckDone) {
    return <Text>Checking seasons...</Text>
  }

  return (
    <VStack spacing={4} align='stretch'>
      <Text fontSize='xl' fontWeight='bold'>
        Select Rooms
      </Text>
      {roomSelections.map((selection, index) => (
        <HStack key={index} spacing={2}>
          <FormControl isRequired>
            <FormLabel>Room Category</FormLabel>
            <Select
              value={selection.categoryId}
              onChange={e =>
                updateRoomSelection(index, 'categoryId', e.target.value)
              }
            >
              <option value=''>Select a category</option>
              {roomCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Occupancy Type</FormLabel>
            <Select
              value={selection.occupancyType}
              onChange={e =>
                updateRoomSelection(index, 'occupancyType', e.target.value)
              }
            >
              <option value=''>Select occupancy type</option>
              {occupancyTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </FormControl>
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
        </HStack>
      ))}
      <Button onClick={addRoomSelection}>Add Another Room</Button>
      <HStack spacing={2} align='stretch'>
        <Button onClick={onBack} flex={1}>
          Back
        </Button>
        <Button colorScheme='teal' onClick={handleSubmit} flex={1}>
          Next
        </Button>
      </HStack>
    </VStack>
  )
}
