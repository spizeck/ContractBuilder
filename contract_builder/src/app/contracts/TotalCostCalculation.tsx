import {useEffect, useState} from 'react'
import {Button, HStack, Text, VStack} from '@chakra-ui/react'
import {ContractData, DivePackage, GroupContract, Hotel, MealPackage, Season} from '@/types'
import {getSeasons} from '@/services/seasons'
import {getRates} from '@/services/rates'
import {getDivePackageById} from '@/services/divePackages'
import {getMealPackageById} from '@/services/mealPackages'
import {getHotelById} from '@/services/hotels'
import {getRoomCategories} from '@/services/roomCategories'
import {addGroupContract, archiveGroupContract} from '@/services/groupContracts'
import {calculateNumberOfNights, calculateTotalCost, determineSeason} from '@/utils/contractCalculations'
import {formatCurrency, formatDate} from '@/utils/formatters'

export default function TotalCostCalculation({
                                               contractData,
                                               onConfirm,
                                               onBack
                                             }: {
  contractData: ContractData
  onConfirm: () => void
  onBack: () => void
}) {
  const [season, setSeason] = useState<Season | null>(null)
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [divePackage, setDivePackage] = useState<DivePackage | null>(null)
  const [mealPackage, setMealPackage] = useState<MealPackage | null>(null)
  const [results, setResults] = useState<ReturnType<typeof calculateTotalCost> | null>(null)
  const [error, setError] = useState<string | null>(null)

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
        roomTotals: results?.roomTotals,
        diveTotals: results?.diveTotals,
        mealTotals: results?.mealTotals,
        overall: results?.overall,
        rooms: contractData.rooms!,
        roomCosts: results?.roomCosts.map(rc => ({
          description: rc.description,
          cost: rc.net // save net cost
        })) || [],
        totalRoomCost: results?.roomTotals.net || 0,
        totalGuests: results?.totalGuests || 0,
        numDivers: contractData.numDivers!,
        totalNonDivers: (results?.totalGuests || 0) - (contractData.numDivers || 0),
        ...(contractData.divePackageId && {
          divePackageId: contractData.divePackageId,
          divePackageName: divePackage?.name ?? null,
          divePackageCost: results?.diveTotals.net ?? null
        }),
        ...(contractData.mealPackageId && {
          mealPackageId: contractData.mealPackageId,
          mealPackageName: mealPackage?.name ?? null,
          mealPackageCost: results?.mealTotals.net ?? null
        }),
        totalCost: results?.overall.net || 0,
        createdAt: new Date()
      }

      await addGroupContract(groupContract)
      alert('Contract saved successfully!')
      onConfirm()
    } catch (error) {
      console.error('Error saving contract:', error)
      setError('An error occurred while saving the contract.')
    }
  }

  useEffect(() => {
    async function fetchData() {
      try {
        if (!contractData.hotelId || !contractData.startDate || !contractData.endDate) {
          setError('Missing required contract data.')
          return
        }

        const hotelData = await getHotelById(contractData.hotelId!)
        setHotel(hotelData)

        const categories = await getRoomCategories(contractData.hotelId)

        const seasons = await getSeasons(contractData.hotelId!)
        const seasonResult = determineSeason(contractData.startDate!, contractData.endDate!, seasons)
        setSeason(seasonResult)

        const ratesData = await getRates(contractData.hotelId!)

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

        if (!hotelData) {
          setError("Hotel data missing")
          return
        }

        const calc = calculateTotalCost(
          contractData,
          seasonResult,
          ratesData,
          divePkg,
          mealPkg,
          categories,
          hotelData
        )
        setResults(calc)
      } catch (error) {
        console.error('Error fetching data:', error)
        setError('An error occurred while calculating the total cost.')
      }
    }

    fetchData()
  }, [contractData])

  if (error) {
    return (
      <VStack spacing={4} align="stretch">
        <Text color="red.500">{error}</Text>
        <Button onClick={onBack}>Back</Button>
      </VStack>
    )
  }

  if (!hotel || !season || !results) {
    return <Text>Loading data...</Text>
  }

  const {roomCosts, roomTotals, diveTotals, mealTotals, overall, totalGuests} = results

  return (
    <VStack spacing={4} align="stretch">
      <Text fontSize="xl" fontWeight="bold">
        Review and Confirm details for: {contractData.groupName}
      </Text>

      <HStack spacing={2}>
        <Text flex={1}>Hotel: {hotel.name}</Text>
        <Text flex={1}>Season: {season.name}</Text>
      </HStack>

      <HStack spacing={2}>
        <Text flex={1}>Check-in: {formatDate(contractData.startDate!)}</Text>
        <Text flex={1}>Check-out: {formatDate(contractData.endDate!)}</Text>
      </HStack>

      <HStack spacing={2}>
        <Text flex={1}>
          Nights: {calculateNumberOfNights(contractData.startDate!, contractData.endDate!)}
        </Text>
        <Text flex={1}>Total Guests: {totalGuests}</Text>
      </HStack>

      {/* Rooms */}
      <Text fontWeight="bold">Room Breakdown:</Text>
      {roomCosts.map((rc, idx) => (
        <VStack key={idx} align="start" spacing={1}>
          <Text>{rc.description}</Text>
          <Text>Gross: ${formatCurrency(rc.gross)}</Text>
          <Text>FOC Value: $({formatCurrency(rc.foc)})</Text>
          <Text>Commission: $({formatCurrency(rc.commission)})</Text>
          <Text>Net: ${formatCurrency(rc.net)}</Text>
        </VStack>
      ))}
      <Text fontWeight="bold">
        Rooms Total Net: ${formatCurrency(roomTotals.net)}
      </Text>

      {/* Dives */}
      {divePackage && (
        <VStack align="start" spacing={1}>
          <Text fontWeight="bold">Dive Package: {divePackage.name}</Text>
          <Text>Gross: ${formatCurrency(diveTotals.gross)}</Text>
          <Text>FOC Value: $({formatCurrency(diveTotals.foc)})</Text>
          <Text>Commission: $({formatCurrency(diveTotals.commission)})</Text>
          <Text>Net: ${formatCurrency(diveTotals.net)}</Text>
        </VStack>
      )}

      {/* Meals */}
      {mealPackage && (
        <VStack align="start" spacing={1}>
          <Text fontWeight="bold">Meal Package: {mealPackage.name}</Text>
          <Text>Gross: ${formatCurrency(mealTotals.gross)}</Text>
          <Text>Commission: $({formatCurrency(mealTotals.commission)})</Text>
          <Text>Net: ${formatCurrency(mealTotals.net)}</Text>
        </VStack>
      )}

      {/* Overall */}
      <Text fontWeight="bold">Overall Totals:</Text>
      <Text>Gross: ${formatCurrency(overall.gross)}</Text>
      <Text>FOC: $({formatCurrency(overall.foc)})</Text>
      <Text>Commission: $({formatCurrency(overall.commission)})</Text>
      <Text fontWeight="bold">Net: ${formatCurrency(overall.net)}</Text>

      <HStack spacing={2}>
        <Button onClick={onBack} flex={1}>
          Back
        </Button>
        <Button colorScheme="teal" onClick={handleConfirm} flex={1}>
          Save
        </Button>
      </HStack>
    </VStack>
  )
}
