'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Divider,
  Heading,
  HStack,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react'
import { getGroupContractById } from '@/services/groupContracts'
import { getHotelById } from '@/services/hotels'
import { GroupContract, Hotel } from '@/types/contractTypes'
import {
  formatCurrency,
  formatDateRange,
  formatFocRule
} from '@/utils/formatters'
import { getCommissionRate } from '@/utils/contractCalculations'
import SignedContractUpload from '../../components/SignedContractUpload'
import { useAuth } from '@/context/AuthContext'

export default function ViewContractPage () {
  const params = useParams()
  const router = useRouter()
  const { id } = params // Firestore contract id
  const { user } = useAuth()

  const [contract, setContract] = useState<GroupContract | null>(null)
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [loading, setLoading] = useState(true)

  const handleGoBack = () => {
    router.back()
  }

  const handleUploadSuccess = (url: string) => {
    if (contract && user) {
      setContract({
        ...contract,
        signedContractUrl: url,
        signedContractUploadedAt: new Date(),
        signedContractUploadedBy: user.uid
      })
    }
  }

  const handleDeleteSuccess = () => {
    if (contract) {
      setContract({
        ...contract,
        signedContractUrl: undefined,
        signedContractUploadedAt: undefined,
        signedContractUploadedBy: undefined
      })
    }
  }

  const handlePrintToPDF = () => {
    window.print()
  }

  useEffect(() => {
    async function fetchData () {
      try {
        const contractData = await getGroupContractById(id as string)
        if (contractData) {
          setContract(contractData)

          if (contractData?.hotelId) {
            const hotelData = await getHotelById(contractData.hotelId)
            setHotel(hotelData)
          }
        } else {
          console.error('Contract not found')
        }
      } catch (err) {
        console.error('Error fetching contract:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  if (loading) {
    return (
      <VStack p={10}>
        <Spinner size='lg' />
        <Text>Loading contract...</Text>
      </VStack>
    )
  }

  if (!contract || !hotel) {
    return (
      <VStack p={10}>
        <Text color='red.500'>Contract not found</Text>
      </VStack>
    )
  }

  return (
    <VStack p={10} spacing={6} align='stretch'>
      <HStack justify='space-between' align='center'>
        <Heading size='lg'>Group Contract</Heading>
        <HStack spacing={3} className='no-print'>
          <Button 
            onClick={handlePrintToPDF}
            colorScheme='blue'
            variant='outline'
          >
            Print to PDF
          </Button>
          <Button 
            onClick={handleGoBack}
            colorScheme='gray'
          >
            Go Back
          </Button>
        </HStack>
      </HStack>
      <Divider />

      {/* Contract Details */}
      <Box>
        <Heading size='md' mb={2}>
          Contract Information
        </Heading>
        <Text>
          <b>Group Name:</b> {contract.groupName}
        </Text>
        <Text>
          <b>Hotel:</b> {hotel.name}
        </Text>
        <Text>
          <b>Contact:</b> {hotel.contactInfo}
        </Text>
        <Text>
          <b>Dates:</b> {formatDateRange(contract.startDate, contract.endDate)}
        </Text>
        <Text>
          <b>Commission Rate:</b>{' '}
          {getCommissionRate(contract.bookingType) * 100}%
        </Text>
        <Text>
          <b>Meal Commission Rate:</b>{' '}
          {(contract.mealCommissionRate ?? 0) * 100}%
        </Text>
        <Text>
          <b>FOC Rules:</b> {formatFocRule(hotel.focRule)}
        </Text>
        <Text>
          <b>Total Guests:</b> {contract.totalGuests}
        </Text>
        <Text>
          <b>Total Divers:</b> {contract.numDivers}
        </Text>
      </Box>

      {/* Overall */}
      <Box>
        <Heading size='md' mb={2}>
          Overall Totals
        </Heading>
        <Text>Gross: ${formatCurrency(contract.overall?.gross)}</Text>
        <Text>FOC Value: $({formatCurrency(contract.overall?.foc)})</Text>
        <Text>
          Commission: $({formatCurrency(contract.overall?.commission)})
        </Text>
        <Text fontWeight='bold'>
          Net: ${formatCurrency(contract.overall?.net)}
        </Text>
      </Box>

      {/* Rooms */}
      {contract.roomCosts?.length > 0 && (
        <Box>
          <Heading size='md' mb={2}>
            Room Breakdown
          </Heading>
          {contract.roomCosts.map((rc, idx) => (
            <Text key={idx}>
              {rc.description}: ${formatCurrency(rc.cost)}
            </Text>
          ))}
          <Text>Gross: ${formatCurrency(contract.roomTotals?.gross)}</Text>
          <Text>FOC Value: $({formatCurrency(contract.roomTotals?.foc)})</Text>
          <Text>
            Commission: $({formatCurrency(contract.roomTotals?.commission)})
          </Text>
          <Text fontWeight='bold'>
            Net: ${formatCurrency(contract.roomTotals?.net)}
          </Text>
        </Box>
      )}

      {/* Dive Package */}
      {contract.divePackageName && (
        <Box>
          <Heading size='md' mb={2}>
            Dive Package
          </Heading>
          <Text>
            {contract.numDivers} Divers with {contract.divePackageName}
          </Text>
          <Text>Gross: ${formatCurrency(contract.diveTotals?.gross)}</Text>
          <Text>FOC Value: $({formatCurrency(contract.diveTotals?.foc)})</Text>
          <Text>
            Commission: $({formatCurrency(contract.diveTotals?.commission)})
          </Text>
          <Text fontWeight='bold'>
            Net: ${formatCurrency(contract.diveTotals?.net)}
          </Text>
        </Box>
      )}

      {/* Meal Package */}
      {contract.mealPackageName && (
        <Box>
          <Heading size='md' mb={2}>
            Meal Package
          </Heading>
          <Text>
            {contract.totalGuests} Guests with {contract.mealPackageName}
          </Text>
          <Text>Gross: ${formatCurrency(contract.mealTotals?.gross)}</Text>
          <Text>
            Commission: $({formatCurrency(contract.mealTotals?.commission)})
          </Text>
          <Text fontWeight='bold'>
            Net: ${formatCurrency(contract.mealTotals?.net)}
          </Text>
        </Box>
      )}

      {/* Hotel Details */}
      <Box>
        <Heading size='md' mb={2}>
          Hotel Information
        </Heading>
        <VStack mb={4} align='start'>
        <Text>
          <b>Location:</b> {hotel.location}
        </Text>
        <Text>
          <b>Description:</b> {hotel.description}
        </Text>
        <Text>
          <b>Amenities:</b> {hotel.amenities}
        </Text>
        <Text>
          <b>Policies:</b> {hotel.policies}
        </Text>
        <Text>
          <b>Restrictions:</b> {hotel.restrictions}
        </Text>
        </VStack>
      </Box>

      {/* Signature */}
      <Box mt={6} className='signature-section'>
        <Heading size='md' mb={2} py={4}>
          Customer Acceptance
        </Heading>

        <VStack spacing={6} align='stretch'>
          <HStack>
            <Text w='120px'>Signature:</Text>
            <Box flex='1' borderBottom='1px solid #000' />
          </HStack>

          <HStack>
            <Text w='120px'>Printed Name:</Text>
            <Box flex='1' borderBottom='1px solid #000' />
          </HStack>

          <HStack>
            <Text w='120px'>Date:</Text>
            <Box flex='1' borderBottom='1px solid #000' />
          </HStack>
        </VStack>
      </Box>

      {/* Signed Contract Upload */}
      <Box mt={6} className='no-print'>
        <SignedContractUpload
          contractId={id as string}
          currentUrl={contract?.signedContractUrl}
          uploadedAt={contract?.signedContractUploadedAt}
          uploadedBy={contract?.signedContractUploadedBy}
          onUploadSuccess={handleUploadSuccess}
          onDeleteSuccess={handleDeleteSuccess}
        />
      </Box>
    </VStack>
  )
}

// Add print styles for better PDF output
if (typeof window !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @media print {
      @page {
        margin: 0.5in;
        size: A4;
      }
      
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
        margin: 0;
        padding: 0;
      }
      
      .no-print {
        display: none !important;
      }
      
      /* Reduce top margin for first page */
      main {
        padding: 1rem 2rem !important;
      }
      
      /* Reduce padding on the contract container */
      .chakra-vstack {
        padding: 1rem !important;
      }
      
      /* Ensure text doesn't break awkwardly */
      * {
        page-break-inside: avoid;
      }
      
      /* Force proper spacing */
      h1, h2, h3 {
        page-break-after: avoid;
        margin-top: 0.5rem;
        margin-bottom: 0.5rem;
      }
      
      /* Ensure signatures are on the same page */
      .signature-section {
        page-break-inside: avoid;
        margin-top: 2rem;
      }
      
      /* Reduce spacing between sections */
      .chakra-stack {
        margin-top: 0.5rem !important;
      }
    }
  `
  document.head.appendChild(style)
}
