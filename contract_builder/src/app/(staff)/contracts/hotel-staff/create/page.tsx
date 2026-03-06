'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@core/auth/AuthContext'
import { getHotelByStaffId } from '@/app/(staff)/contracts/_lib/hotelStaffRepo'
import { Hotel } from '@/app/(staff)/contracts/_types'
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Spinner,
  Icon,
  Alert,
  AlertIcon,
  Card,
  CardBody,
  CardHeader
} from '@chakra-ui/react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import GroupContractWizard from '../../components/GroupContractWizard'

export default function HotelStaffCreateContractPage() {
  const { user, role, loading } = useAuth()
  const router = useRouter()
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && user && (role === 'hotel-staff' || role === 'hotel-manager')) {
      loadHotelData()
    } else if (!loading && !user) {
      router.push('/login?redirect=/contracts/hotel-staff/create')
    } else if (!loading && user && role !== 'hotel-staff' && role !== 'hotel-manager') {
      router.push('/')
    }
  }, [user, role, loading, router])

  const loadHotelData = async () => {
    if (!user) return

    try {
      setLoadingData(true)
      const hotelData = await getHotelByStaffId(user.uid)
      setHotel(hotelData)
    } catch (error) {
      console.error('Error loading hotel data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleCancel = () => {
    router.push('/contracts/hotel-staff')
  }

  if (loading || loadingData) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minH="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="info" thickness="4px" />
          <Text color="textSecondary">Loading...</Text>
        </VStack>
      </Box>
    )
  }

  if (!user || (role !== 'hotel-staff' && role !== 'hotel-manager')) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minH="100vh">
        <Card maxW="md">
          <CardHeader>
            <Heading size="md" color="error" textAlign="center">Access Denied</Heading>
          </CardHeader>
          <CardBody>
            <Text textAlign="center" color="textSecondary">
              You don't have permission to create contracts.
            </Text>
          </CardBody>
        </Card>
      </Box>
    )
  }

  if (!hotel) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minH="100vh">
        <Card maxW="md">
          <CardHeader>
            <Heading size="md" color="warning" textAlign="center">No Hotel Assigned</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4}>
              <Text textAlign="center" color="textSecondary">
                You haven't been assigned to a hotel yet. Please contact your administrator.
              </Text>
              <Link href="/contracts/hotel-staff">
                <Button>Back to Dashboard</Button>
              </Link>
            </VStack>
          </CardBody>
        </Card>
      </Box>
    )
  }

  return (
    <Box maxW="6xl" mx="auto" px={4} py={8}>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between" mb={4}>
          <HStack>
            <Link href="/contracts/hotel-staff">
              <Button variant="ghost">
                <Icon as={ArrowLeft} h={4} w={4} mr={2} />
                Back to Dashboard
              </Button>
            </Link>
            <VStack align="start" spacing={1}>
              <Heading size="xl" color="textPrimary">Create New Contract</Heading>
              <Text color="textSecondary">Creating contract for {hotel.name}</Text>
            </VStack>
          </HStack>
        </HStack>

        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <VStack align="start" spacing={1}>
            <Text fontWeight="bold">Hotel Pre-Selected</Text>
            <Text fontSize="sm">
              This contract will be created for your hotel: {hotel.name}. 
              The hotel selection will be locked in the contract wizard.
            </Text>
          </VStack>
        </Alert>

        <GroupContractWizard 
          onCancel={handleCancel}
          prefilledHotelId={hotel.id}
          isHotelStaff={true}
        />
      </VStack>
    </Box>
  )
}
