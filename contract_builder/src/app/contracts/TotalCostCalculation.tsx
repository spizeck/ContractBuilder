import { useEffect, useState } from 'react'
import { Button, HStack, Text, VStack } from '@chakra-ui/react'
import {
  ContractData,
  DivePackage,
  GroupContract,
  Hotel,
  MealPackage,
  Rate,
  RoomCategory,
  Season
} from '@/types'
import { getSeasons } from '@/services/seasons'
import { getRates } from '@/services/rates'
import { getDivePackageById } from '@/services/divePackages'
import { getMealPackageById } from '@/services/mealPackages'
import { getHotelById, parseFocRule } from '@/services/hotels'
import { getRoomCategories } from '@/services/roomCategories'
import {
  addGroupContract,
  archiveGroupContract
} from '@/services/groupContracts'
import {
  calculateNumberOfNights,
  calculateTotalCost,
  determineSeason,
  getCommissionRate
} from '@/utils/contractCalculations'

export default function TotalCostCalculation ({
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

  const [totalFreeRooms, setTotalFreeRooms] = useState<number>(0)
  const [adjustedRoomCost, setAdjustedRoomCost] = useState<number>(0)
  const [adjustedRoomCommission, setAdjustedRoomCommission] =
    useState<number>(0)
  const [diveCommission, setDiveCommission] = useState<number>(0)
  const [mealCommission, setMealCommission] = useState<number>(0)
  const [divingFocCount, setDivingFocCount] = useState<number>(0)

  const handleConfirm = async () => {
    try {
      if (contractData.id) {
        await archiveGroupContract(contractData.id)
      }

      const groupContract: Omit<GroupContract, 'id'> = {
        archived: false,
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
      }

      await addGroupContract(groupContract)
      alert('Contract saved successfully!')
      onConfirm()
    } catch (error: any) {
      console.log('contractData', contractData)
      setError('An error occurred while saving the contract.')
    }
  }

  useEffect(() => {
    async function fetchData () {
      try {
        if (
          !contractData.hotelId ||
          !contractData.startDate ||
          !contractData.endDate
        ) {
          setError('Missing required contract data.')
          return
        }

        const hotelData = await getHotelById(contractData.hotelId!)
        setHotel(hotelData)

        const categories = await getRoomCategories(contractData.hotelId)
        setRoomCategories(categories)

        const seasons = await getSeasons(contractData.hotelId!)
        const seasonResult = determineSeason(
          contractData.startDate!,
          contractData.endDate!,
          seasons
        )
        setSeasonName(seasonResult.name)
        setSeason(seasonResult)

        const ratesData = await getRates(contractData.hotelId!)
        setRates(ratesData)

        let divePkg: DivePackage | null = null
        if (contractData.divePackageId) {
          divePkg = await getDivePackageById(contractData.divePackageId)
          setDivePackage(divePkg)
        }

        let mealPkg: MealPackage | null = null
        if (contractData.mealPackageId) {
          mealPkg = await getMealPackageById(contractData.mealPackageId)
          setMealPackage(mealPkg)
        }

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

        const roomFoc = parseFocRule(hotelData?.focRule)
        const focDenominator = roomFoc.paid + roomFoc.free
        const divingFoc = { paid: 7, free: 1 }

        const calculatedFreeRooms =
          focDenominator > 0 ? Math.floor(totalGuests / focDenominator) : 0
        setTotalFreeRooms(calculatedFreeRooms)

        const roomTotal = roomCosts.reduce((sum, rc) => sum + rc.cost, 0)
        setAdjustedRoomCost(roomTotal)
        setAdjustedRoomCommission(roomTotal * commissionRate)

        const focDivers = Math.floor(
          (contractData.numDivers || 0) / (divingFoc.paid + divingFoc.free)
        )
        setDivingFocCount(focDivers)
        const adjustedNumDivers = (contractData.numDivers || 0) - focDivers
        const diveTotal = (divePkg?.price || 0) * adjustedNumDivers
        setDiveCommission(diveTotal * commissionRate)

        const mealRate = hotelData?.mealCommissionRate || 0
        const mealTotal = (mealPkg?.price || 0) * totalGuests
        setMealCommission(mealTotal * mealRate)
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
        <Text flex={1}>
          Commission Rate: {(commissionRate * 100).toFixed(0)}%
        </Text>
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
        <Text flex={1}>
          Total Non-Divers: {totalGuests - (contractData.numDivers || 0)}
        </Text>
      </HStack>

      <Text fontWeight='bold'>Room Breakdown:</Text>
      {roomCosts.map((roomCost, index) => (
        <Text key={index}>
          {roomCost.description}: ${roomCost.cost.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </Text>
      ))}

      <HStack spacing={2}>
        <Text flex={1}>Total Hotel Guests: {totalGuests}</Text>
        <Text flex={1}>Total Hotel FOC: {totalFreeRooms}</Text>
      </HStack>

      <Text>Gross Room Cost: ${adjustedRoomCost.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}</Text>
      <Text>Total Room Commission: ${adjustedRoomCommission.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}</Text>

      {mealPackage && (
        <VStack align='start' spacing={4}>
          <Text>
            <Text as='span' fontWeight='bold'>
              Meal Package Selected:
            </Text>{' '}
            {mealPackage.name}
          </Text>
          <Text>Gross Meal Package Cost: ${mealPackageCost.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}</Text>
          <Text>Commission on Meal Package: ${mealCommission.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}</Text>
        </VStack>
      )}

      {divePackage && (
        <VStack align='start' spacing={4}>
          <Text>
            <Text as='span' fontWeight='bold'>
              Dive Package Selected:
            </Text>{' '}
            {divePackage.name}
          </Text>
          <Text>Gross Dive Package Cost: ${divePackageCost.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}</Text>
          <Text>Commission on Dive Package: ${diveCommission.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}</Text>
        </VStack>
      )}

      <Text fontWeight='bold'>Total Cost Breakdown:</Text>
      <Text>Gross Cost: ${totalCost.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}</Text>
      <Text>
        Total Commission: $
        {(adjustedRoomCommission + mealCommission + diveCommission).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
      </Text>
      <Text>
        Total FOC Value: ${(divePackage?.price || 0) * divingFocCount}
      </Text>
      <Text fontWeight='bold'>
        Net Cost: $
        {(
          totalCost -
          adjustedRoomCommission -
          mealCommission -
          diveCommission
        ).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
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
