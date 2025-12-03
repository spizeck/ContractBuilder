'use client'

import { useEffect, useState } from 'react'
import NextLink from 'next/link'
import { Timestamp } from 'firebase/firestore'
import {
  Box,
  Button,
  Flex,
  HStack,
  Input,
  Select,
  Stack,
  Text,
  VStack,
  useBreakpointValue
} from '@chakra-ui/react'
import {
  archiveGroupContract,
  formatBookingType,
  getGroupContracts
} from '@/services/groupContracts'
import { getHotels } from '@/services/hotels'
import { GroupContract, Hotel } from '@/types/contractTypes'

export default function GroupContractsList ({
  onBack,
  onCreateNew,
  onEditContract
}: {
  onBack: () => void
  onCreateNew: () => void
  onEditContract: (contract: any) => void
}) {
  const [contracts, setContracts] = useState<GroupContract[]>([])
  const [filteredContracts, setFilteredContracts] = useState<GroupContract[]>(
    []
  )
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [filters, setFilters] = useState<{
    groupName: string
    hotelId: string
    startDate: string
  }>({
    groupName: '',
    hotelId: '',
    startDate: ''
  })

  const isMobile = useBreakpointValue({ base: true, md: false })

  useEffect(() => {
    fetchContracts()
    fetchHotels()
  }, [])

  const fetchContracts = async () => {
    const contractsData = await getGroupContracts()
    const activeContracts = contractsData.filter(c => !c.archived)
    
    // Sort contracts by start date (oldest first)
    const sortedContracts = activeContracts.sort((a, b) => {
      const dateA = new Date(a.startDate)
      const dateB = new Date(b.startDate)
      return dateA.getTime() - dateB.getTime()
    })
    
    setContracts(sortedContracts)
    setFilteredContracts(sortedContracts)
  }

  const fetchHotels = async () => {
    const hotelsData = await getHotels()
    setHotels(hotelsData)
  }

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    const updatedFilters = { ...filters, [name]: value }
    setFilters(updatedFilters)
    applyFilters(updatedFilters)
  }

  const applyFilters = (updatedFilters: typeof filters) => {
    let filtered = contracts

    if (updatedFilters.groupName) {
      filtered = filtered.filter(contract =>
        contract.groupName
          .toLowerCase()
          .includes(updatedFilters.groupName.toLowerCase())
      )
    }
    if (updatedFilters.hotelId) {
      filtered = filtered.filter(
        contract => contract.hotelId === updatedFilters.hotelId
      )
    }
    if (updatedFilters.startDate) {
      const selectedDate = new Date(updatedFilters.startDate)
      filtered = filtered.filter(
        contract =>
          new Date(contract.startDate) <= selectedDate &&
          new Date(contract.endDate) >= selectedDate
      )
    }

    // Maintain sorting by start date even after filtering
    const sortedFiltered = filtered.sort((a, b) => {
      const dateA = new Date(a.startDate)
      const dateB = new Date(b.startDate)
      return dateA.getTime() - dateB.getTime()
    })

    setFilteredContracts(sortedFiltered)
  }

  function parseCreatedAt (dateVal: any): Date {
    if (!dateVal) return new Date(NaN)

    if (dateVal instanceof Timestamp) {
      return dateVal.toDate()
    }

    if (dateVal instanceof Date) {
      return dateVal
    }

    if (
      typeof dateVal === 'object' &&
      typeof dateVal.seconds === 'number' &&
      typeof dateVal.nanoseconds === 'number'
    ) {
      return new Date(dateVal.seconds * 1000)
    }

    const parsed = new Date(dateVal)
    return isNaN(parsed.getTime()) ? new Date(NaN) : parsed
  }

  const handleArchiveContract = async (contractId: string) => {
    if (confirm('Are you sure you want to archive this contract?')) {
      await archiveGroupContract(contractId)
      fetchContracts()
    }
  }

  const getHotelName = (hotelId: string) => {
    const hotel = hotels.find(h => h.id === hotelId)
    return hotel ? hotel.name : 'Unknown'
  }

  return (
    <VStack spacing={4} align='stretch'>
      {/* Action buttons */}
      <Flex gap={3} justify='flex-start'>
        <Button onClick={onBack} colorScheme='gray' flex={1}>
          Back
        </Button>
        <Button onClick={onCreateNew} colorScheme='teal' flex={1}>
          New Contract
        </Button>
      </Flex>

      {/* Filters */}
      <Flex gap={2} direction={{ base: 'column', md: 'row' }} align='stretch'>
        <Input
          placeholder='Filter by Group Name'
          name='groupName'
          value={filters.groupName}
          onChange={handleFilterChange}
        />
        <Select
          placeholder='Filter by Hotel'
          name='hotelId'
          value={filters.hotelId}
          onChange={handleFilterChange}
        >
          {hotels.map(hotel => (
            <option key={hotel.id} value={hotel.id}>
              {hotel.name}
            </option>
          ))}
        </Select>
        <Input
          type='date'
          placeholder='Filter by Start Date'
          name='startDate'
          value={filters.startDate}
          onChange={handleFilterChange}
        />
      </Flex>

      {/* Contracts List */}
      <Stack spacing={4}>
        {filteredContracts.map(contract => (
          <Box
            key={contract.id}
            borderWidth='1px'
            borderRadius='lg'
            p={4}
            shadow='sm'
          >
            <Text fontWeight='bold' isTruncated>
              {contract.groupName}
            </Text>
            <Text color='gray.600' isTruncated>
              {getHotelName(contract.hotelId)}
            </Text>
            <Text fontSize='sm' color='gray.500'>
              {contract.startDate} → {contract.endDate}
            </Text>
            <Text fontSize='xs' color='gray.400'>
              {formatBookingType(contract.bookingType)} ·{' '}
              {parseCreatedAt(contract.createdAt).toLocaleString()}
            </Text>

            <HStack mt={2} spacing={2}>
              <Button
                as={NextLink}
                href={`/contracts/${contract.id}/view`}
                size='sm'
                flex='1'
                variant='outline'
              >
                View
              </Button>
              <Button
                size='sm'
                flex='1'
                onClick={() => onEditContract(contract)}
              >
                Edit
              </Button>
              <Button
                size='sm'
                flex='1'
                colorScheme='red'
                onClick={() => handleArchiveContract(contract.id)}
              >
                Archive
              </Button>
            </HStack>
          </Box>
        ))}

        {filteredContracts.length === 0 && (
          <Text color='gray.500' fontStyle='italic'>
            No contracts found.
          </Text>
        )}
      </Stack>
    </VStack>
  )
}
