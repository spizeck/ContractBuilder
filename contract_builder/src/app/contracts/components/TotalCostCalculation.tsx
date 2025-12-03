import { useEffect, useState } from 'react'
import {
  Button,
  HStack,
  Text,
  VStack,
  Card,
  CardHeader,
  CardBody,
  Flex,
  Input,
  IconButton
} from '@chakra-ui/react'
import { CheckIcon, CloseIcon } from '@chakra-ui/icons'
import {
  ContractData,
  DivePackage,
  GroupContract,
  Hotel,
  MealPackage,
  Season
} from '@/types/contractTypes'
import { getSeasons } from '@/services/seasons'
import { getRates } from '@/services/rates'
import { getDivePackageById } from '@/services/divePackages'
import { getMealPackageById } from '@/services/mealPackages'
import { getHotelById } from '@/services/hotels'
import { getRoomCategories } from '@/services/roomCategories'
import {
  addGroupContract,
  archiveGroupContract,
  formatBookingType
} from '@/services/groupContracts'
import {
  calculateNumberOfNights,
  calculateTotalCost,
  determineSeason,
  getCommissionRate
} from '@/utils/contractCalculations'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { getRoomTypes } from '@/services/roomTypes'

export default function TotalCostCalculation ({
  contractData,
  onConfirm,
  onBack,
  onEditStep,
  onCancel
}: {
  contractData: ContractData
  onConfirm: () => void
  onBack: () => void
  onCancel: () => void
  onEditStep?: (step: number) => void // 👈 allow jumping back into a specific step
}) {
  const [season, setSeason] = useState<Season | null>(null)
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [divePackage, setDivePackage] = useState<DivePackage | null>(null)
  const [mealPackage, setMealPackage] = useState<MealPackage | null>(null)
  const [results, setResults] = useState<ReturnType<
    typeof calculateTotalCost
  > | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Custom room rates state
  const [customRates, setCustomRates] = useState<{ [key: string]: number }>({})
  const [isEditingRates, setIsEditingRates] = useState(false)
  const [tempRates, setTempRates] = useState<{ [key: string]: number }>({})
  const [originalRates, setOriginalRates] = useState<{ [key: string]: number }>({})

  // Handler functions for rate editing
  const handleStartEditingRates = () => {
    if (results && results.roomCosts) {
      const rates: { [key: string]: number } = {}
      results.roomCosts.forEach((rc, idx) => {
        // Extract rate from description string
        const rateMatch = rc.description.match(/@ \$(\d+\.\d+)\/night/)
        if (rateMatch) {
          rates[idx] = parseFloat(rateMatch[1])
        }
      })
      setTempRates(rates)
      setOriginalRates(rates)
      setIsEditingRates(true)
    }
  }

  const handleSaveRates = () => {
    setCustomRates(tempRates)
    setIsEditingRates(false)
    // Recalculate costs with new rates
    recalculateWithCustomRates(tempRates)
  }

  const handleCancelEditingRates = () => {
    setTempRates(originalRates)
    setIsEditingRates(false)
  }

  const handleRateChange = (idx: number, value: string) => {
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0) {
      setTempRates(prev => ({ ...prev, [idx]: numValue }))
    }
  }

  const recalculateWithCustomRates = (rates: { [key: string]: number }) => {
    // This will be implemented to recalculate costs with custom rates
    // For now, we'll trigger a re-render by updating results
    if (results && season) {
      // Create a copy of results with updated rates
      const updatedRoomCosts = results.roomCosts.map((rc, idx) => {
        if (rates[idx] !== undefined) {
          const nightsMatch = rc.description.match(/for (\d+) nights/)
          const roomsMatch = rc.description.match(/(\d+) x/)
          const nights = nightsMatch ? parseInt(nightsMatch[1]) : 1
          const numRooms = roomsMatch ? parseInt(roomsMatch[1]) : 1
          const newRate = rates[idx]
          const gross = numRooms * nights * newRate
          const commissionRate = getCommissionRate(contractData.bookingType || '')
          const commission = gross * commissionRate
          const net = gross - commission
          
          // Update description with new rate
          const newDescription = rc.description.replace(/@ \$\d+\.\d+\/night/, `@ $${newRate.toFixed(2)}/night`)
          
          return {
            ...rc,
            description: newDescription,
            gross,
            commission,
            net
          }
        }
        return rc
      })

      // Recalculate totals
      const newRoomTotals = updatedRoomCosts.reduce(
        (acc, rc) => ({
          gross: acc.gross + rc.gross,
          foc: acc.foc + (rc.foc || 0),
          commission: acc.commission + rc.commission,
          net: acc.net + rc.net
        }),
        { gross: 0, foc: 0, commission: 0, net: 0 }
      )

      // Apply FOC calculation similar to original
      const focDeduction = results.roomTotals.foc || 0
      const adjustedGross = newRoomTotals.gross - focDeduction
      const commissionRate = getCommissionRate(contractData.bookingType || '')
      const finalRoomTotals = {
        gross: newRoomTotals.gross,
        foc: focDeduction,
        commission: adjustedGross * commissionRate,
        net: adjustedGross * (1 - commissionRate)
      }

      // Update overall totals
      const newOverall = {
        gross: finalRoomTotals.gross + (results.diveTotals?.gross || 0) + (results.mealTotals?.gross || 0),
        foc: (finalRoomTotals.foc || 0) + (results.diveTotals?.foc || 0),
        commission: finalRoomTotals.commission + (results.diveTotals?.commission || 0) + (results.mealTotals?.commission || 0),
        net: finalRoomTotals.net + (results.diveTotals?.net || 0) + (results.mealTotals?.net || 0)
      }

      setResults({
        ...results,
        roomCosts: updatedRoomCosts,
        roomTotals: finalRoomTotals,
        overall: newOverall
      })
    }
  }

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
        roomCosts:
          results?.roomCosts.map(rc => ({
            description: rc.description,
            cost: rc.net
          })) || [],
        totalRoomCost: results?.roomTotals.net || 0,
        totalGuests: results?.totalGuests || 0,
        numDivers: contractData.numDivers!,
        totalNonDivers:
          (results?.totalGuests || 0) - (contractData.numDivers || 0),
        ...(contractData.divePackageId && {
          divePackageId: contractData.divePackageId,
          divePackageName: divePackage?.name ?? null,
          divePackageCost: results?.diveTotals.net ?? null
        }),
        ...(contractData.mealPackageId && {
          mealPackageId: contractData.mealPackageId,
          mealPackageName: mealPackage?.name ?? null,
          mealPackageCost: results?.mealTotals.net ?? null,
          mealCommissionRate: mealPackage?.commissionRate ?? 0
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
        const roomTypes = await getRoomTypes(contractData.hotelId)

        const seasons = await getSeasons(contractData.hotelId!)
        const seasonResult = determineSeason(
          contractData.startDate!,
          contractData.endDate!,
          seasons
        )
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
          setError('Hotel data missing')
          return
        }

        const calc = calculateTotalCost(
          contractData,
          seasonResult,
          ratesData,
          divePkg,
          mealPkg,
          categories,
          roomTypes,
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
      <VStack spacing={4} align='stretch'>
        <Text color='red.500'>{error}</Text>
        <Button onClick={onBack}>Back</Button>
      </VStack>
    )
  }

  if (!hotel || !season || !results) {
    return <Text>Loading data...</Text>
  }

  const {
    roomCosts,
    roomTotals,
    diveTotals,
    mealTotals,
    overall,
    totalGuests
  } = results

  return (
    <VStack spacing={4} align='stretch'>
      <Text fontSize='xl' fontWeight='bold'>
        Review and Confirm details for: {contractData.groupName}
      </Text>

      {/* Hotel Info */}
      <Card>
        <CardHeader py={2} px={3}>
          <Flex justify='space-between'>
            <Text fontWeight='bold'>Hotel & Dates</Text>
            {onEditStep && (
              <Button size='sm' onClick={() => onEditStep(1)}>
                Edit
              </Button>
            )}
          </Flex>
        </CardHeader>
        <CardBody>
          <Text>Hotel: {hotel.name}</Text>
          <Text>Season: {season.name}</Text>
          <Text>Check-in: {formatDate(contractData.startDate!)}</Text>
          <Text>Check-out: {formatDate(contractData.endDate!)}</Text>
          <Text>
            Nights:{' '}
            {calculateNumberOfNights(
              contractData.startDate!,
              contractData.endDate!
            )}
          </Text>
          <Text>Total Guests: {totalGuests}</Text>
          <Text>
            Booking Type: {formatBookingType(contractData.bookingType!)}
          </Text>
          <Text>
            Meal Commission Rate: {(mealPackage?.commissionRate ?? 0) * 100}%
          </Text>
        </CardBody>
      </Card>

      {/* Rooms */}
      <Card>
        <CardHeader py={2} px={3}>
          <Flex justify='space-between'>
            <Text fontWeight='bold'>Rooms</Text>
            <HStack spacing={2}>
              {onEditStep && (
                <Button size='sm' onClick={() => onEditStep(2)}>
                  Edit Rooms
                </Button>
              )}
              <Button size='sm' onClick={isEditingRates ? handleCancelEditingRates : handleStartEditingRates}>
                {isEditingRates ? 'Cancel' : 'Edit Rates'}
              </Button>
            </HStack>
          </Flex>
        </CardHeader>
        <CardBody>
          {roomCosts.map((rc, idx) => (
            <VStack key={idx} align='stretch' spacing={1}>
              {isEditingRates ? (
                <HStack spacing={2}>
                  <Text flex={1}>{rc.description.replace(/@ \$\d+\.\d+\/night/, '@ $')}</Text>
                  <Input
                    type='number'
                    value={tempRates[idx]?.toFixed(2) || ''}
                    onChange={(e) => handleRateChange(idx, e.target.value)}
                    size='sm'
                    width='80px'
                    step='0.01'
                    min='0'
                  />
                  <Text>/night</Text>
                </HStack>
              ) : (
                <Text>
                  {rc.description}
                  {customRates[idx] !== undefined && ' *'}
                </Text>
              )}
            </VStack>
          ))}
          <Text>Gross: ${formatCurrency(roomTotals.gross)}</Text>
          <Text>FOC Value: $({formatCurrency(roomTotals.foc)})</Text>
          <Text>Commission: $({formatCurrency(roomTotals.commission)})</Text>
          <Text>Net: ${formatCurrency(roomTotals.net)}</Text>
          {isEditingRates && (
            <HStack spacing={2} mt={3}>
              <Button
                size='sm'
                colorScheme='green'
                leftIcon={<CheckIcon />}
                onClick={handleSaveRates}
              >
                Save Rates
              </Button>
              <Button
                size='sm'
                colorScheme='red'
                leftIcon={<CloseIcon />}
                onClick={handleCancelEditingRates}
              >
                Cancel
              </Button>
            </HStack>
          )}
        </CardBody>
      </Card>

      {/* Dives */}
      {divePackage && (
        <Card>
          <CardHeader py={2} px={3}>
            <Flex justify='space-between'>
              <Text fontWeight='bold'>Dives</Text>
              {onEditStep && (
                <Button size='sm' onClick={() => onEditStep(3)}>
                  Edit
                </Button>
              )}
            </Flex>
          </CardHeader>
          <CardBody>
            <Text>
              Dive Package: {divePackage.name} for{' '}
              {diveTotals.gross > 0 ? diveTotals.gross / divePackage.price : 0}{' '}
              divers
            </Text>
            <Text>Gross: ${formatCurrency(diveTotals.gross)}</Text>
            <Text>FOC Value: $({formatCurrency(diveTotals.foc)})</Text>
            <Text>Commission: $({formatCurrency(diveTotals.commission)})</Text>
            <Text>Net: ${formatCurrency(diveTotals.net)}</Text>
          </CardBody>
        </Card>
      )}

      {/* Meals */}
      {mealPackage && (
        <Card>
          <CardHeader py={2} px={3}>
            <Flex justify='space-between'>
              <Text fontWeight='bold'>Meals</Text>
              {onEditStep && (
                <Button size='sm' onClick={() => onEditStep(4)}>
                  Edit
                </Button>
              )}
            </Flex>
          </CardHeader>
          <CardBody>
            <Text>Meal Package: {mealPackage.name}</Text>
            <Text>Gross: ${formatCurrency(mealTotals.gross)}</Text>
            <Text>Commission: $({formatCurrency(mealTotals.commission)})</Text>
            <Text>Net: ${formatCurrency(mealTotals.net)}</Text>
          </CardBody>
        </Card>
      )}

      {/* Overall */}
      <Card>
        <CardHeader py={2} px={3}>
          <Text fontWeight='bold'>Overall Totals</Text>
        </CardHeader>
        <CardBody>
          <Text>Gross: ${formatCurrency(overall.gross)}</Text>
          <Text>FOC: $({formatCurrency(overall.foc)})</Text>
          <Text>Commission: $({formatCurrency(overall.commission)})</Text>
          <Text fontWeight='bold'>Net: ${formatCurrency(overall.net)}</Text>
        </CardBody>
      </Card>

      {/* Actions */}
      <HStack spacing={2}>
        <Button
          colorScheme='red'
          flex={1}
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
        <Button colorScheme='teal' onClick={handleConfirm} flex={1}>
          Save
        </Button>
      </HStack>
    </VStack>
  )
}
