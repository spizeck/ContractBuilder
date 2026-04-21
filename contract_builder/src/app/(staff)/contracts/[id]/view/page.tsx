'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Badge,
  Box,
  Button,
  Divider,
  Heading,
  HStack,
  Spinner,
  Text,
  VStack,
  Collapse,
  useDisclosure
} from '@chakra-ui/react'
import { getGroupContractById } from '@/app/(staff)/contracts/_lib/groupContractsRepo'
import { getHotelById } from '@/app/(staff)/contracts/_lib/hotelsRepo'
import { GroupContract, Hotel } from '@/app/(staff)/contracts/_types'
import {
  formatCurrency,
  formatDateRange,
  formatFocRule
} from '@shared/utils/formatters'
import { getCommissionRate } from '@/app/(staff)/contracts/_lib/contractCalculations'
import SignedContractUpload from '../../components/SignedContractUpload'
import { useAuth } from '@core/auth/AuthContext'
import PaymentModal from '../../components/PaymentModal'
import ContractNotes from '../../components/ContractNotes'
import { Payment } from '@/app/(staff)/contracts/_types'
import { getPayments } from '@/app/(staff)/contracts/_lib/paymentsRepo'
import PaymentHistory from '../../components/PaymentHistory'

export default function ViewContractPage () {
  const params = useParams()
  const router = useRouter()
  const { id } = params // Firestore contract id
  const { user, role, loading: authLoading } = useAuth()

  // Check if user is hotel staff. While auth is loading, treat as staff to keep admin-only actions hidden.
  const isHotelStaff =
    authLoading || role === 'hotel-staff' || role === 'hotel-manager'

  const [contract, setContract] = useState<GroupContract | null>(null)
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Payment modal state
  const { 
    isOpen: isPaymentModalOpen, 
    onOpen: onPaymentModalOpen, 
    onClose: onPaymentModalClose 
  } = useDisclosure()

  // Refresh key to trigger PaymentHistory re-fetch
  const [paymentRefreshKey, setPaymentRefreshKey] = useState(0)

  const handleGoBack = () => {
    router.back()
  }

  const handleEditContract = () => {
    // Navigate to the contracts page with edit mode using URL parameter id
    router.push(`/app/contracts?edit=${id}`)
  }

  const handleUploadSuccess = (url: string) => {
    if (contract && user) {
      setContract({
        ...contract,
        signedContractUrl: url,
        signedContractUploadedAt: new Date(),
        signedContractUploadedBy: user.uid,
        signedContractUploadedByName: user.displayName || user.email || undefined
      })
    }
  }

  const handleDeleteSuccess = () => {
    if (contract) {
      setContract({
        ...contract,
        signedContractUrl: undefined,
        signedContractUploadedAt: undefined,
        signedContractUploadedBy: undefined,
        signedContractUploadedByName: undefined
      })
    }
  }

  const handlePaymentAdded = (payment: Payment) => {
    // Refresh contract data to get updated payment summary
    fetchData()
    // Increment refresh key to trigger PaymentHistory re-fetch
    setPaymentRefreshKey(prev => prev + 1)
  }

  const handlePaymentDeleted = () => {
    // Refresh contract data to get updated payment summary
    fetchData()
    // Increment refresh key to trigger PaymentHistory re-fetch
    setPaymentRefreshKey(prev => prev + 1)
  }

  const fetchData = async () => {
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

  const handlePrintToPDF = () => {
    // Store original document title
    const originalTitle = document.title
    
    // Set custom filename for PDF
    if (contract) {
      document.title = `Group Contract ${contract.groupName}`
    }
    
    // Print with improved margins
    window.print()
    
    // Restore original title
    document.title = originalTitle
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
    <VStack p={10} spacing={6} align='stretch' className="print-container">
      {/* Logo Header - Print Only */}
      <HStack 
        justify="space-between" 
        align="center" 
        py={4} 
        className="print-only logo-header"
      >
        {/* Sea Saba Logo - Left aligned */}
        <Box display="flex" alignItems="center" height="80px">
          <img 
            src="/SS_blue.svg" 
            alt="Sea Saba Logo" 
            style={{ height: '80px', width: 'auto', display: 'block' }}
          />
        </Box>
        
        {/* Hotel Logo - Right aligned if available */}
        {hotel?.logoUrl && (
          <Box display="flex" alignItems="center" justifyContent="flex-end" height="80px">
            <img 
              src={hotel.logoUrl} 
              alt={`${hotel.name} Logo`} 
              style={{ maxHeight: '80px', maxWidth: '240px', objectFit: 'contain', display: 'block' }}
            />
          </Box>
        )}
      </HStack>

      <HStack justify='flex-end' spacing={3} className='no-print'>
        {!isHotelStaff && (
          <Button 
            onClick={handleEditContract}
            colorScheme='teal'
            variant='outline'
          >
            Edit Contract
          </Button>
        )}
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
          
          {/* Hotel Addons */}
          {contract.hotelAddons && contract.hotelAddons.length > 0 && (
            <>
              {contract.hotelAddons.map((addon, idx) => (
                <Text key={idx}>
                  {addon.description}: ${formatCurrency(addon.amount)}
                </Text>
              ))}
            </>
          )}
          
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
          
          {/* Dive Addons */}
          {contract.diveAddons && contract.diveAddons.length > 0 && (
            <>
              {contract.diveAddons.map((addon, idx) => (
                <Text key={idx}>
                  {addon.description}: ${formatCurrency(addon.amount)}
                </Text>
              ))}
            </>
          )}
          
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
          
          {/* Meal Addons */}
          {contract.mealAddons && contract.mealAddons.length > 0 && (
            <>
              {contract.mealAddons.map((addon, idx) => (
                <Text key={idx}>
                  {addon.description}: ${formatCurrency(addon.amount)}
                </Text>
              ))}
            </>
          )}
          
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
      <VStack mt={6} className='print-only signature-section'>
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
      </VStack>

      {/* Payment Section */}
      <Box mt={6} className='no-print'>
        <VStack spacing={4} align="stretch">
          <HStack justify="space-between" align="center">
            <Heading size="md">Payment Tracking</Heading>
            {!isHotelStaff && (
              <Button 
                colorScheme="blue" 
                onClick={onPaymentModalOpen}
                isDisabled={!contract}
              >
                Add Payment
              </Button>
            )}
          </HStack>
          
          {contract && (
            <PaymentHistory
              contractId={id as string}
              contractTotalCost={contract.totalCost}
              onPaymentDeleted={handlePaymentDeleted}
              refreshKey={paymentRefreshKey}
              isHotelStaff={isHotelStaff}
            />
          )}
        </VStack>
      </Box>

      {/* Notes Section */}
      <Box mt={6} className='no-print'>
        <ContractNotes contractId={id as string} isHotelStaff={isHotelStaff} />
      </Box>

      {/* CHECKFRONT_DISABLED: entire Checkfront section commented out — re-enable by restoring JSX block */}

      {/* Signed Contract Upload */}
      {!isHotelStaff && (
        <Box mt={6} className='no-print'>
          <SignedContractUpload
            contractId={id as string}
            currentUrl={contract?.signedContractUrl}
            uploadedAt={contract?.signedContractUploadedAt}
            uploadedByName={contract?.signedContractUploadedByName}
            onUploadSuccess={handleUploadSuccess}
            onDeleteSuccess={handleDeleteSuccess}
          />
        </Box>
      )}

      {/* Payment Modal */}
      {contract && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={onPaymentModalClose}
          contractId={id as string}
          contractTotalCost={contract?.totalCost || 0}
          totalPaid={contract?.totalPaid || 0}
          onPaymentAdded={handlePaymentAdded}
        />
      )}
    </VStack>
  )
}

// Add print styles for better PDF output
if (typeof window !== 'undefined') {
  if (!document.getElementById('contract-view-styles')) {
  const style = document.createElement('style')
  style.id = 'contract-view-styles'
  style.textContent = `
    /* Hide print-only content by default */
    .print-only {
      display: none !important;
    }
    
    @media print {
      @page {
        margin: 0.25in;
        size: Letter;
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
      
      /* Show print-only content during printing */
      .print-only {
        display: flex !important;
      }
      
      /* Logo header styling */
      .logo-header {
        page-break-inside: avoid;
        page-break-after: avoid;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid #e2e8f0;
      }
      
      .logo-header img {
        max-height: 80px;
        width: auto;
        object-fit: contain;
      }
      
      /* Reduce top margin for first page */
      main {
        padding: 1rem 2rem !important;
      }
      
      /* Target the main print container specifically */
      .print-container {
        padding: 0.5rem !important;
        padding-top: 0.25rem !important;
      }
      
      /* Reduce padding on other vstacks */
      .chakra-vstack:not(.print-container) {
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
        width: 100%;
      }
      
      .signature-section .chakra-stack {
        width: 100%;
      }
      
      .signature-section .chakra-stack > div {
        display: flex !important;
        width: 100%;
        align-items: center;
      }
      
      /* Reduce spacing between sections */
      .chakra-stack {
        margin-top: 0.5rem !important;
      }
    }
  `
  document.head.appendChild(style)
  }
}
