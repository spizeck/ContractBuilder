import { useEffect, useState } from "react";
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
  Select,
} from "@chakra-ui/react";
import { getGroupContracts, deleteGroupContract, GroupContract } from "@/services/groupContracts";
import { getHotels, Hotel } from "@/services/hotels";

interface Filters {
  groupName: string;
  hotelId: string;
  startDate: string;
}

export default function GroupContractsList({
  onCreateNew,
  onEditContract,
}: {
  onCreateNew: () => void;
  onEditContract: (contractId: string) => void;
}) {
  const [contracts, setContracts] = useState<GroupContract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<GroupContract[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [filters, setFilters] = useState<Filters>({
    groupName: "",
    hotelId: "",
    startDate: "",
  });

  useEffect(() => {
    fetchContracts();
    fetchHotels();
  }, []);

  const fetchContracts = async () => {
    const contractsData = await getGroupContracts();
    setContracts(contractsData);
    setFilteredContracts(contractsData);
  };

  const fetchHotels = async () => {
    const hotelsData = await getHotels();
    setHotels(hotelsData);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
    applyFilters({ ...filters, [name]: value });
  };

  const applyFilters = (filters: Filters) => {
    let filtered = contracts;

    if (filters.groupName) {
      filtered = filtered.filter((contract) =>
        contract.groupName.toLowerCase().includes(filters.groupName.toLowerCase())
      );
    }
    if (filters.hotelId) {
      filtered = filtered.filter((contract) => contract.hotelId === filters.hotelId);
    }
    if (filters.startDate) {
      filtered = filtered.filter((contract) => contract.startDate === filters.startDate);
    }

    setFilteredContracts(filtered);
  };

  const handleDeleteContract = async (contractId: string) => {
    if (confirm("Are you sure you want to delete this contract?")) {
      await deleteGroupContract(contractId);
      fetchContracts();
    }
  };

  const getHotelName = (hotelId: string) => {
    const hotel = hotels.find((h) => h.id === hotelId);
    return hotel ? hotel.name : "Unknown";
  };

  return (
    <VStack spacing={4} align="stretch">
      <HStack justifyContent="space-between">
        <Button colorScheme="teal" onClick={onCreateNew}>
          Create New Contract
        </Button>
      </HStack>
      <HStack spacing={2}>
        <Input
          placeholder="Filter by Group Name"
          name="groupName"
          value={filters.groupName}
          onChange={handleFilterChange}
        />
        <Select placeholder="Filter by Hotel" name="hotelId" value={filters.hotelId} onChange={handleFilterChange}>
          {hotels.map((hotel) => (
            <option key={hotel.id} value={hotel.id}>
              {hotel.name}
            </option>
          ))}
        </Select>
        <Input
          type="date"
          placeholder="Filter by Start Date"
          name="startDate"
          value={filters.startDate}
          onChange={handleFilterChange}
        />
      </HStack>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Group Name</Th>
            <Th>Hotel</Th>
            <Th>Start Date</Th>
            <Th>End Date</Th>
            <Th>Booking Type</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {filteredContracts.map((contract) => (
            <Tr key={contract.id}>
              <Td>{contract.groupName}</Td>
              <Td>{getHotelName(contract.hotelId)}</Td>
              <Td>{contract.startDate}</Td>
              <Td>{contract.endDate}</Td>
              <Td>{contract.bookingType}</Td>
              <Td>
                <HStack spacing={2}>
                  <Button size="sm" onClick={() => onEditContract(contract.id)}>
                    Edit
                  </Button>
                  <Button size="sm" colorScheme="red" onClick={() => handleDeleteContract(contract.id)}>
                    Delete
                  </Button>
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </VStack>
  );
}
