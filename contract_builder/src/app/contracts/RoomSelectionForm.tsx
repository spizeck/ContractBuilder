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
import { getRoomTypes } from '@/services/roomTypes'
import { Rate, RoomCategory, Season, RoomType } from '@/types'

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
  initialRooms = []
}: {
  hotelId: string
  startDate: string
  endDate: string
  onNext: (data: { rooms: RoomSelection[] }) => void
  onBack: () => void
  initialRooms?: RoomSelection[]
}) {
  const [roomCategories, setRoomCategories] = useState<RoomCategory[]>([])
  const [rates, setRates] = useState<Rate[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [roomSelections, setRoomSelections] =
    useState<RoomSelection[]>(initialRooms)
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null)
  const [seasonCheckDone, setSeasonCheckDone] = useState(false)

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

    if (field === 'categoryId') {
      const matchingRates = rates.filter(
        rate =>
          rate.seasonId === selectedSeason?.id && rate.categoryId === value
      )

      const uniqueOccupancies = Array.from(
        new Set(matchingRates.map(rate => rate.occupancyType))
      )

      updatedSelections[index] = {
        ...updatedSelections[index],
        categoryId: value,
        occupancyType:
          uniqueOccupancies.length === 1 ? uniqueOccupancies[0] : ''
      }
    } else {
      updatedSelections[index] = {
        ...updatedSelections[index],
        [field]: field === 'numRooms' ? parseInt(value) : value
      }
    }

    setRoomSelections(updatedSelections)
  }

  const handleSubmit = () => {
    const roomTypeQuantities: { [key: string]: number } = {}

    roomSelections.forEach(sel => {
      const key = `${sel.categoryId}-${sel.occupancyType}`
      roomTypeQuantities[key] = (roomTypeQuantities[key] || 0) + sel.numRooms
    })

    for (const key in roomTypeQuantities) {
      const [categoryId, occupancyType] = key.split('-')
      const matched = roomTypes.find(
        (rt: RoomType) =>
          rt.categoryId === categoryId && rt.name === occupancyType
      )
      if (matched && roomTypeQuantities[key] > matched.quantity) {
        alert(
          `You requested ${roomTypeQuantities[key]} rooms for ${occupancyType}, but only ${matched.quantity} are available.`
        )
        return
      }
    }
    // console.log('Room selections are valid:', roomSelections)
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
              {filteredRoomCategories.map(category => (
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
              {rates
                .filter(
                  rate =>
                    rate.seasonId === selectedSeason?.id &&
                    rate.categoryId === selection.categoryId
                )
                .map(rate => rate.occupancyType)
                .filter((value, index, self) => self.indexOf(value) === index) // unique
                .map(type => (
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
          <Button
            onClick={() => removeRoomSelection(index)}
            colorScheme='red'
            alignSelf='flex-end'
          >
            X
          </Button>
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
