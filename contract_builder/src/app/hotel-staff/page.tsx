'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getHotelByStaffId, getContractsForStaff } from '@/services/hotelStaff'
import { Hotel, GroupContract } from '@/types/contractTypes'
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
import { Hotel as HotelIcon, FileText, Calendar, Users } from 'lucide-react'
import Link from 'next/link'

export default function HotelStaffDashboard() {
  const { user, role, loading } = useAuth()
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [contracts, setContracts] = useState<GroupContract[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && user && (role === 'staff' || role === 'manager')) {
      loadDashboardData()
    } else if (!loading && !user) {
      // Redirect to login if not authenticated
      window.location.href = '/login?redirect=/hotel-staff'
    } else if (!loading && user && role !== 'staff' && role !== 'manager') {
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

  if (!user || (role !== 'staff' && role !== 'manager')) {
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
  const activeContracts = contracts.filter(c => !c.archived)

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
                  <Text fontSize="sm" color="textSecondary" fontWeight="medium">Active Contracts</Text>
                  <Text fontSize="2xl" fontWeight="bold" color="textPrimary">{activeContracts.length}</Text>
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
                    {contracts.reduce((sum, c) => sum + c.totalGuests, 0)}
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
                <Link href="/hotel-staff/hotel">
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
              <Text color="textSecondary" mb={4}>View and manage all contracts assigned to your hotel.</Text>
              <VStack spacing={2}>
                <Link href="/hotel-staff/contracts">
                  <Button w="full" variant="outline">
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
                  <Box key={contract.id} p={4} borderWidth={1} borderRadius="lg">
                    <HStack justify="space-between" align="start">
                      <VStack align="start" spacing={1}>
                        <Heading size="md" color="textPrimary">{contract.groupName}</Heading>
                        <Text fontSize="sm" color="gray.600">
                          {new Date(contract.startDate).toLocaleDateString()} - {new Date(contract.endDate).toLocaleDateString()}
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          <Text color="textSecondary">{contract.totalGuests} guests</Text> • {contract.numDivers} divers
                        </Text>
                      </VStack>
                      <VStack align="end" spacing={1}>
                        <Badge variant={contract.archived ? "subtle" : "solid"} colorScheme={contract.archived ? "gray" : "blue"}>
                          {contract.archived ? "Archived" : "Active"}
                        </Badge>
                        <Text fontSize="sm" fontWeight="bold">
                          ${contract.totalCost.toLocaleString()}
                        </Text>
                      </VStack>
                    </HStack>
                  </Box>
                ))}
                {contracts.length > 5 && (
                  <Box textAlign="center" pt={4}>
                    <Link href="/hotel-staff/contracts">
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
