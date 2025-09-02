import { useEffect, useState } from 'react'
import { Timestamp } from 'firebase/firestore'
import {
  VStack,
  HStack,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  Select
} from '@chakra-ui/react'
import {
  getGroupContracts,
  archiveGroupContract,
  formatBookingType
} from '@/services/groupContracts'
import { getHotels } from '@/services/hotels'
import { GroupContract, Hotel } from '@/types'

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

  useEffect(() => {
    fetchContracts()
    fetchHotels()
  }, [])

  const fetchContracts = async () => {
    const contractsData = await getGroupContracts()
    const activeContracts = contractsData.filter(c => !c.archived)
    setContracts(activeContracts)
    setFilteredContracts(activeContracts)
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
      filtered = filtered.filter(
        contract => contract.startDate === updatedFilters.startDate
      )
    }

    setFilteredContracts(filtered)
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
      <HStack justifyContent='space-between'>
        <Button onClick={onBack}>Back</Button>
        <Button colorScheme='teal' onClick={onCreateNew}>
          Create New Contract
        </Button>
      </HStack>
      <HStack spacing={2}>
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
      </HStack>
      <Table variant='simple'>
        <Thead>
          <Tr>
            <Th>Group Name</Th>
            <Th>Hotel</Th>
            <Th>Start Date</Th>
            <Th>End Date</Th>
            <Th>Booking Type</Th>
            <Th>Created At</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {filteredContracts.map(contract => (
            <Tr key={contract.id}>
              <Td>{contract.groupName}</Td>
              <Td>{getHotelName(contract.hotelId)}</Td>
              <Td>{contract.startDate}</Td>
              <Td>{contract.endDate}</Td>
              <Td>{formatBookingType(contract.bookingType)}</Td>
              <Td>{parseCreatedAt(contract.createdAt).toLocaleString()}</Td>
              <Td>
                <HStack spacing={2}>
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
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </VStack>
  )
}
