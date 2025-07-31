import {useEffect, useState} from 'react'
import {Button, HStack, Text, VStack} from '@chakra-ui/react'
import {ContractData, DivePackage, GroupContract, Hotel, MealPackage, Rate, RoomCategory, Season} from '@/types'
import {getSeasons} from '@/services/seasons'
import {getRates} from '@/services/rates'
import {getDivePackageById} from '@/services/divePackages'
import {getMealPackageById} from '@/services/mealPackages'
import {getHotelById} from '@/services/hotels'
import {getRoomCategories} from '@/services/roomCategories'
import {addGroupContract} from '@/services/groupContracts'
import {
  calculateNumberOfNights,
  calculateTotalCost,
  determineSeason,
  getCommissionRate
} from '@/utils/contractCalculations'

export default function TotalCostCalculation({
                                               contractData,
                                               onConfirm,
                                               onBack
                                             }: {
  contractData: ContractData
  onConfirm: () => void
  onBack: () => void
}) {
  const [totalCost, setTotalCost] = useState<number>(0)
  const [seasonName, setSeasonName] = useState<string>('Calculating...')
  const [season, setSeason] = useState<Season | null>(null)
  const [rates, setRates] = useState<Rate[]>([])
  const [divePackage, setDivePackage] = useState<DivePackage | null>(null)
  const [mealPackage, setMealPackage] = useState<MealPackage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [roomCosts, setRoomCosts] = useState<
    { description: string; cost: number }[]
  >([])
  const [divePackageCost, setDivePackageCost] = useState<number>(0)
  const [mealPackageCost, setMealPackageCost] = useState<number>(0)
  const [totalGuests, setTotalGuests] = useState<number>(0)
  const [roomCategories, setRoomCategories] = useState<RoomCategory[]>([])
  const [commissionRate, setCommissionRate] = useState(0)
  const [commissionAmount, setCommissionAmount] = useState(0)
  console.log(contractData)

  const handleConfirm = async () => {
    try {
      // Prepare the contract data
      const groupContract: Omit<GroupContract, 'id'> = {
        groupName: contractData.groupName!,
        startDate: contractData.startDate!,
        endDate: contractData.endDate!,
        hotelId: hotel!.id,
        hotelName: hotel!.name,
        seasonId: season!.id,
        seasonName: season!.name,
        bookingType: contractData.bookingType!,
        rooms: contractData.rooms!,
        roomCosts,
        totalRoomCost: roomCosts.reduce((sum, room) => sum + room.cost, 0),
        totalGuests,
        numDivers: contractData.numDivers!,
        totalNonDivers: totalGuests - (contractData.numDivers || 0),
        ...(contractData.divePackageId && {
          divePackageId: contractData.divePackageId,
          divePackageName: divePackage?.name ?? null,
          divePackageCost: divePackageCost ?? null
        }),
        ...(contractData.mealPackageId && {
          mealPackageId: contractData.mealPackageId,
          mealPackageName: mealPackage?.name ?? null,
          mealPackageCost: mealPackageCost ?? null
        }),
        totalCost,
        createdAt: new Date()
        // Add other fields as needed
      }

      // Save the contract to Firestore
      const contractId = await addGroupContract(groupContract)
      alert('Contract saved successfully!')

      onConfirm()
    } catch (error: any) {
      // console.error('Error saving contract:', error)
      console.log('contractData', contractData)
      setError('An error occurred while saving the contract.')
    }
  }

  useEffect(() => {
    async function fetchData() {
      try {
        // Check for required contract data
        if (
          !contractData.hotelId ||
          !contractData.startDate ||
          !contractData.endDate
        ) {
          setError('Missing required contract data.')
          return
        }

        // Fetch hotel
        const hotelData = await getHotelById(contractData.hotelId!)
        setHotel(hotelData)

        // Fetch room categories
        const categories = await getRoomCategories(contractData.hotelId)
        setRoomCategories(categories)

        // Fetch seasons
        const seasons = await getSeasons(contractData.hotelId!)
        const seasonResult = determineSeason(
          contractData.startDate!,
          contractData.endDate!,
          seasons
        )
        setSeasonName(seasonResult.name)
        setSeason(seasonResult)

        // Fetch rates
        const ratesData = await getRates(contractData.hotelId!)
        setRates(ratesData)

        // Fetch dive package
        let divePkg: DivePackage | null = null
        if (contractData.divePackageId) {
          divePkg = await getDivePackageById(contractData.divePackageId)
          setDivePackage(divePkg)
        }

        // Fetch meal package
        let mealPkg: MealPackage | null = null
        if (contractData.mealPackageId) {
          mealPkg = await getMealPackageById(contractData.mealPackageId)
          setMealPackage(mealPkg)
        }

        // Calculate total cost
        const {
          totalCost,
          roomCosts,
          divePackageCost,
          mealPackageCost,
          totalGuests
        } = await calculateTotalCost(
          contractData,
          seasonResult,
          ratesData,
          divePkg,
          mealPkg,
          categories
        )

        setTotalCost(totalCost)

        const commissionRate = getCommissionRate(contractData.bookingType!)
        const commissionAmount = totalCost * commissionRate

        setCommissionRate(commissionRate)
        setCommissionAmount(commissionAmount)
        setRoomCosts(roomCosts)
        setDivePackageCost(divePackageCost)
        setMealPackageCost(mealPackageCost)
        setTotalGuests(totalGuests)
      } catch (error) {
        console.error('Error fetching data:', error)
        setError('An error occurred while calculating the total cost.')
      }
    }

    fetchData()
  }, [contractData])

  if (error) {
    return (
      <VStack spacing={4} align='stretch'>
        <Text color='red.500'>{error}</Text>
        <Button onClick={onBack}>Back</Button>
      </VStack>
    )
  }

  if (!hotel || !season) {
    return <Text>Loading data...</Text>
  }

  return (
    <VStack spacing={4} align='stretch'>
      <Text fontSize='xl' fontWeight='bold'>
        Review and Confirm details for: {contractData.groupName}
      </Text>

      <HStack spacing={2}>
        <Text flex={1}>Hotel: {hotel.name}</Text>
        <Text flex={1}>Commission Rate: {(commissionRate * 100).toFixed(0)}%</Text>
      </HStack>

      <HStack spacing={2}>
        <Text flex={1}>Check-in: {contractData.startDate}</Text>
        <Text flex={1}>Check-out: {contractData.endDate}</Text>
      </HStack>

      <HStack spacing={2}>
        <Text flex={1}>
          Number of Nights:{' '}
          {calculateNumberOfNights(
            contractData.startDate!,
            contractData.endDate!
          )}
        </Text>
        <Text flex={1}>Season: {seasonName}</Text>
      </HStack>
      <HStack spacing={2}>
        <Text flex={1}>Total Divers: {contractData.numDivers}</Text>
        <Text flex={1}>Total Non-Divers: {totalGuests - contractData.numDivers || 0}</Text>
      </HStack>

      {/* Room Breakdown */}
      <Text fontWeight='bold'>Room Breakdown:</Text>
      {roomCosts.map((roomCost, index) => (
        <Text key={index}>
          {roomCost.description}: ${roomCost.cost.toFixed(2)}
        </Text>
      ))}
      <HStack spacing={2}>
        <Text flex={1}>Total Hotel Guests: {totalGuests}</Text>
        <Text flex={1}>Total Hotel FOC: </Text>
      </HStack>
      <Text>Total Room Cost: </Text>
      <Text>Total Room Commission</Text>

      {/* Meal Package Breakdown */}
      {mealPackage && (
        <VStack align="start" spacing={4}>
          <Text>
            <Text as="span" fontWeight="bold">Meal Package Selected:</Text> {mealPackage.name}
          </Text>
          <Text>Total Meal Package Cost: ${mealPackageCost.toFixed(2)}</Text>
          <Text>Commission on Meal Package: ${(mealPackageCost * commissionRate).toFixed(2)}</Text>
        </VStack>
      )}

      {/* Diving Breakdown */}
      {divePackage && (
        <VStack align="start" spacing={4}>
          <Text>
            <Text as="span" fontWeight="bold">Dive Package Selected:</Text> {divePackage.name}
          </Text>
          <Text>Total Dive Package Cost: ${divePackageCost.toFixed(2)}</Text>
          <Text>Commission on Dive Package: ${(divePackageCost * commissionRate).toFixed(2)}</Text>
        </VStack>
      )}

      <Text fontWeight='bold'>Gross Cost: ${totalCost.toFixed(2)}</Text>

      <Text>Commission Amount: ${commissionAmount.toFixed(2)}</Text>

      <Text fontWeight='bold'>
        Net Cost: ${(totalCost - commissionAmount).toFixed(2)}
      </Text>

      <HStack spacing={2}>
        <Button onClick={onBack} flex={1}>
          Back
        </Button>
        <Button colorScheme='teal' onClick={handleConfirm} flex={1}>
          Save
        </Button>
      </HStack>
    </VStack>
  )
}
