'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getContractsForStaff } from '@/services/hotelStaff'
import { GroupContract } from '@/types/contractTypes'
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
  Input,
  Badge,
  InputGroup,
  InputLeftElement,
  Spinner,
  Icon,
  SimpleGrid
} from '@chakra-ui/react'
import { ArrowLeft, FileText, Calendar, Users, Search, Download } from 'lucide-react'
import Link from 'next/link'

export default function HotelContractsPage() {
  const { user, role, loading } = useAuth()
  const [contracts, setContracts] = useState<GroupContract[]>([])
  const [filteredContracts, setFilteredContracts] = useState<GroupContract[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && user && (role === 'staff' || role === 'manager')) {
      loadContracts()
    } else if (!loading && !user) {
      // Redirect to login if not authenticated
      window.location.href = '/login?redirect=/hotel-staff/contracts'
    } else if (!loading && user && role !== 'staff' && role !== 'manager') {
      // Redirect to dashboard if wrong role
      window.location.href = '/'
    }
  }, [user, role, loading])

  useEffect(() => {
    // Filter contracts based on search term
    const filtered = contracts.filter(contract =>
      contract.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.hotelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.seasonName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredContracts(filtered)
  }, [searchTerm, contracts])

  const loadContracts = async () => {
    if (!user) return

    try {
      setLoadingData(true)
      const contractsData = await getContractsForStaff(user.uid)
      setContracts(contractsData)
    } catch (error) {
      console.error('Error loading contracts:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const getStatusBadge = (contract: GroupContract) => {
    if (contract.archived) {
      return <Badge variant="secondary">Archived</Badge>
    }
    
    if (contract.paymentStatus === 'paid-in-full') {
      return <Badge variant="default" className="bg-green-600">Paid in Full</Badge>
    }
    
    if (contract.paymentStatus === 'deposit-paid') {
      return <Badge variant="default" className="bg-yellow-600">Deposit Paid</Badge>
    }
    
    return <Badge variant="outline">Unpaid</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const exportContracts = () => {
    // Simple CSV export
    const headers = ['Group Name', 'Hotel', 'Season', 'Start Date', 'End Date', 'Guests', 'Divers', 'Total Cost', 'Payment Status']
    const csvContent = [
      headers.join(','),
      ...filteredContracts.map(contract => [
        contract.groupName,
        contract.hotelName,
        contract.seasonName,
        formatDate(contract.startDate),
        formatDate(contract.endDate),
        contract.totalGuests,
        contract.numDivers,
        contract.totalCost,
        contract.paymentStatus || 'unpaid'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hotel-contracts-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  if (loading || loadingData) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minH="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="info" thickness="4px" />
          <Text color="textSecondary">Loading contracts...</Text>
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
              You don't have permission to access contract management.
            </Text>
          </CardBody>
        </Card>
      </Box>
    )
  }

  return (
    <Box maxW="6xl" mx="auto" px={4} py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <HStack justify="space-between" mb={4}>
            <HStack>
              <Link href="/hotel-staff">
                <Button variant="ghost" mr={4}>
                  <Icon as={ArrowLeft} h={4} w={4} mr={2} />
                  Back to Dashboard
                </Button>
              </Link>
              <HStack>
                <Icon as={FileText} h={8} w={8} color="info" mr={3} />
                <VStack align="start" spacing={1}>
                  <Heading size="xl" color="textPrimary">Hotel Contracts</Heading>
                  <Text color="textSecondary">View all contracts assigned to your hotel</Text>
                </VStack>
              </HStack>
            </HStack>
            
            <Button onClick={exportContracts} variant="outline">
              <Icon as={Download} h={4} w={4} mr={2} />
              Export CSV
            </Button>
          </HStack>
        </Box>

        <Card>
          <CardBody p={4}>
            <HStack spacing={4}>
              <InputGroup flex={1}>
                <InputLeftElement>
                  <Icon as={Search} h={4} w={4} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search contracts by group name, hotel, or season..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  pl={10}
                />
              </InputGroup>
              <Text fontSize="sm" color="textSecondary">
                Showing {filteredContracts.length} of {contracts.length} contracts
              </Text>
            </HStack>
          </CardBody>
        </Card>

        {filteredContracts.length === 0 ? (
          <Card>
            <CardBody p={8}>
              <VStack>
                <Icon as={FileText} h={12} w={12} color="textMuted" />
                <Heading size="lg" color="textPrimary" mb={2}>
                  {searchTerm ? 'No contracts found' : 'No contracts available'}
                </Heading>
                <Text color="textSecondary">
                  {searchTerm 
                    ? 'Try adjusting your search terms'
                    : 'Contracts will appear here once they are assigned to your hotel'
                  }
                </Text>
              </VStack>
            </CardBody>
          </Card>
        ) : (
          <VStack spacing={4} align="stretch">
            {filteredContracts.map((contract) => (
              <Card key={contract.id} _hover={{ shadow: 'md' }} transition="shadow 0.2s">
                <CardBody p={6}>
                  <HStack justify="space-between" align="start">
                    <VStack align="start" spacing={2} flex={1}>
                      <HStack mb={2}>
                        <Heading size="sm" color="textPrimary" mr={3}>
                          {contract.groupName}
                        </Heading>
                        {getStatusBadge(contract)}
                      </HStack>
                      
                      <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} fontSize="sm" color="textSecondary">
                        <HStack>
                          <Icon as={Calendar} h={4} w={4} color="gray.400" />
                          <Text>
                            {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
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
                        ${contract.totalCost.toLocaleString()}
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
          </VStack>
        )}
      </VStack>
    </Box>
  )
}
