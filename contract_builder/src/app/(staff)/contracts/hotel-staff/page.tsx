'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@core/auth/AuthContext'
import { getHotelByStaffId, getContractsForStaff } from '@/app/(staff)/contracts/_lib/hotelStaffRepo'
import { Hotel, GroupContract } from '@/app/(staff)/contracts/_types'
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Card,
  CardBody,
  CardHeader,
  Button,
  Badge,
  SimpleGrid,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  Icon,
  Divider
} from '@chakra-ui/react'
import { FileText, Calendar, Users, Hotel as HotelIcon } from 'lucide-react'
import PaymentStatusBadge from '../components/PaymentStatusBadge'
import Link from 'next/link'

export default function HotelStaffDashboard() {
  const { user, role, loading } = useAuth()
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [contracts, setContracts] = useState<GroupContract[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && user && (role === 'hotel-staff' || role === 'hotel-manager')) {
      loadDashboardData()
    } else if (!loading && !user) {
      // Redirect to login if not authenticated
      window.location.href = '/login?redirect=/contracts/hotel-staff'
    } else if (!loading && user && role !== 'hotel-staff' && role !== 'hotel-manager') {
      // Redirect to dashboard if wrong role
      window.location.href = '/'
    }
  }, [user, role, loading])

  const loadDashboardData = async () => {
    if (!user) {
      console.log('No user available for dashboard load')
      return
    }

    try {
      console.log('Starting dashboard data load for user:', user.uid)
      setLoadingData(true)
      
      const [hotelData, contractsData] = await Promise.all([
        getHotelByStaffId(user.uid),
        getContractsForStaff(user.uid)
      ])
      
      console.log('Dashboard data loaded:', { hotelData, contractsCount: contractsData.length })
      setHotel(hotelData)
      setContracts(contractsData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      // Set empty data to prevent infinite loading
      setHotel(null)
      setContracts([])
    } finally {
      setLoadingData(false)
    }
  }

  if (loading || loadingData) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minH="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="info" thickness="4px" />
          <Text color="textSecondary">Loading dashboard...</Text>
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
              You don't have permission to access hotel management.
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
            <Text textAlign="center" color="textSecondary">
              You haven't been assigned to a hotel yet. Please contact your administrator.
            </Text>
          </CardBody>
        </Card>
      </Box>
    )
  }

  const recentContracts = contracts.slice(0, 5)
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const upcomingContracts = contracts.filter(c => {
    const endDateStr = c.endDate.slice(0, 10)
    return endDateStr >= todayStr && !c.archived
  })
  const totalGuests = contracts.reduce((sum, c) => sum + c.totalGuests, 0)

  return (
    <Box maxW="6xl" mx="auto" px={4} py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="xl" color="textPrimary">Hotel Staff Dashboard</Heading>
          <Text color="textSecondary">Manage your hotel and view contracts</Text>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <Card>
            <CardBody p={6}>
              <HStack>
                <Icon as={HotelIcon} h={8} w={8} color="info" mr={3} />
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" color="textSecondary" fontWeight="medium">Your Hotel</Text>
                  <Text fontSize="2xl" fontWeight="bold" color="textPrimary">{hotel.name}</Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>

          <Card>
            <CardBody p={6}>
              <HStack>
                <Icon as={FileText} h={8} w={8} color="success" mr={3} />
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" color="textSecondary" fontWeight="medium">Total Contracts</Text>
                  <Text fontSize="2xl" fontWeight="bold" color="textPrimary">{contracts.length}</Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>

          <Card>
            <CardBody p={6}>
              <HStack>
                <Icon as={Calendar} h={8} w={8} color="info" mr={3} />
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" color="textSecondary" fontWeight="medium">Upcoming Contracts</Text>
                  <Text fontSize="2xl" fontWeight="bold" color="textPrimary">{upcomingContracts.length}</Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>

          <Card>
            <CardBody p={6}>
              <HStack>
                <Icon as={Users} h={8} w={8} color="warning" mr={3} />
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" color="textSecondary" fontWeight="medium">Total Guests</Text>
                  <Text fontSize="2xl" fontWeight="bold" color="textPrimary">
                    {totalGuests}
                  </Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
          <Card>
            <CardHeader>
              <HStack>
                <Icon as={HotelIcon} h={5} w={5} />
                <Heading size="md">Hotel Management</Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <Text color="textSecondary" mb={4}>Edit your hotel details, amenities, policies, and contact information.</Text>
              <VStack spacing={2}>
                <Link href="/contracts/hotel-staff/hotel">
                  <Button w="full">Edit Hotel Details</Button>
                </Link>
              </VStack>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <HStack>
                <Icon as={FileText} h={5} w={5} />
                <Heading size="md" color="textPrimary">Contract Management</Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <Text color="textSecondary" mb={4}>Create new contracts and view existing contracts for your hotel.</Text>
              <VStack spacing={2}>
                <Link href="/contracts/hotel-staff/create" style={{ width: '100%' }}>
                  <Button w="full" colorScheme="blue">
                    Create New Contract
                  </Button>
                </Link>
                <Link href="/contracts/hotel-staff/contracts" style={{ width: '100%' }}>
                  <Button w="full" variant="outline" colorScheme="gray">
                    View All Contracts ({contracts.length})
                  </Button>
                </Link>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        <Card>
          <CardHeader>
            <Heading size="md" color="textPrimary">Recent Contracts</Heading>
          </CardHeader>
          <CardBody>
            {recentContracts.length === 0 ? (
              <Text color="textSecondary" textAlign="center" py={4}>No contracts found</Text>
            ) : (
              <VStack spacing={4} align="stretch">
                {recentContracts.map((contract) => (
                  <Card key={contract.id} _hover={{ shadow: 'md' }} transition="shadow 0.2s">
                    <CardBody p={6}>
                      <HStack justify="space-between" align="start">
                        <VStack align="start" spacing={2} flex={1}>
                          <HStack mb={2}>
                            <Heading size="sm" color="textPrimary" mr={3}>
                              {contract.groupName}
                            </Heading>
                            <Badge
                              size="sm"
                              colorScheme={
                                contract.paymentStatus === 'paid'
                                  ? 'green'
                                  : contract.paymentStatus === 'partial'
                                  ? 'yellow'
                                  : 'red'
                              }
                            >
                              {contract.paymentStatus === 'paid'
                                ? 'Paid'
                                : contract.paymentStatus === 'partial'
                                ? 'Partially Paid'
                                : 'Unpaid'}
                            </Badge>
                          </HStack>
                          
                          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} fontSize="sm" color="textSecondary">
                            <HStack>
                              <Icon as={Calendar} h={4} w={4} color="gray.400" />
                              <Text>
                                {new Date(contract.startDate).toLocaleDateString()} - {new Date(contract.endDate).toLocaleDateString()}
                              </Text>
                            </HStack>
                            
                            <HStack>
                              <Icon as={Users} h={4} w={4} color="gray.400" />
                              <Text>
                                {contract.totalGuests} guests ({contract.numDivers} divers)
                              </Text>
                            </HStack>
                            
                            <Text>
                              <Text as="span" fontWeight="medium">Season:</Text> {contract.seasonName}
                            </Text>
                          </SimpleGrid>

                          <Text fontSize="sm" color="textSecondary">
                            <Text as="span" fontWeight="medium">Hotel:</Text> {contract.hotelName}
                            {contract.divePackageName && (
                              <Text as="span" ml={4}>
                                <Text as="span" fontWeight="medium">Dive Package:</Text> {contract.divePackageName}
                              </Text>
                            )}
                            {contract.mealPackageName && (
                              <Text as="span" ml={4}>
                                <Text as="span" fontWeight="medium">Meal Package:</Text> {contract.mealPackageName}
                              </Text>
                            )}
                          </Text>
                        </VStack>
                        
                        <VStack align="end" spacing={1} ml={6}>
                          <Text fontSize="2xl" fontWeight="bold" color="textPrimary">
                            ${contract.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Text>
                          <Text fontSize="sm" color="textMuted">
                            Total Cost
                          </Text>
                          
                          <Box mt={3}>
                            <Link href={`/contracts/${contract.id}/view`}>
                              <Button variant="outline" size="sm">
                                View Details
                              </Button>
                            </Link>
                          </Box>
                        </VStack>
                      </HStack>
                    </CardBody>
                  </Card>
                ))}
                {contracts.length > 5 && (
                  <Box textAlign="center" pt={4}>
                    <Link href="/contracts/hotel-staff/contracts">
                      <Button variant="outline">View All Contracts</Button>
                    </Link>
                  </Box>
                )}
              </VStack>
            )}
          </CardBody>
        </Card>
      </VStack>
    </Box>
  )
}
