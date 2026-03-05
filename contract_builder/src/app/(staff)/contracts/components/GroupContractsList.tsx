"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
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
  Heading,
} from "@chakra-ui/react";
import {
  archiveGroupContract,
  formatBookingType,
  getGroupContracts,
} from "@/app/(staff)/contracts/_lib/groupContractsRepo";
import { getHotels } from "@/app/(staff)/contracts/_lib/hotelsRepo";
import { GroupContract, Hotel } from "@/app/(staff)/contracts/_types";
import PaymentStatusBadge from "./PaymentStatusBadge";
import { parseDate } from "@shared/utils/dateHelpers";
import PaymentDashboard from "./PaymentDashboard";
import { formatCurrency, toInputDate, parseDateOnly } from "@shared/utils/formatters";
import CustomDatePicker from "@shared/components/DatePicker";

export default function GroupContractsList({
  onBack,
  onCreateNew,
  onEditContract,
}: {
  onBack: () => void;
  onCreateNew: () => void;
  onEditContract: (contract: any) => void;
}) {
  const [contracts, setContracts] = useState<GroupContract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<GroupContract[]>(
    []
  );
  const [viewMode, setViewMode] = useState<"upcoming" | "past">("upcoming");
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [filters, setFilters] = useState<{
    groupName: string;
    hotelId: string;
    startDate: string;
    paymentStatus: string;
  }>({
    groupName: "",
    hotelId: "",
    startDate: "",
    paymentStatus: "",
  });

  useEffect(() => {
    fetchContracts();
    fetchHotels();
  }, []);

  // Refresh contracts when component gains focus (e.g., navigating back from contract view)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchContracts();
      }
    };

    // Listen for page visibility changes
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const fetchContracts = async () => {
    const contractsData = await getGroupContracts();
    const activeContracts = contractsData.filter((c) => !c.archived);

    // Sort contracts by start date (oldest first)
    const sortedContracts = [...activeContracts].sort((a, b) => {
      const dateA = new Date(a.startDate);
      const dateB = new Date(b.startDate);
      return dateA.getTime() - dateB.getTime();
    });

    setContracts(sortedContracts);
    applyFilters(filters, viewMode, sortedContracts);
  };

  const fetchHotels = async () => {
    const hotelsData = await getHotels();
    setHotels(hotelsData);
  };

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const updatedFilters = { ...filters, [name]: value };
    setFilters(updatedFilters);
    applyFilters(updatedFilters);
  };

  const getTodayStr = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  };

  const applyFilters = (updatedFilters: typeof filters, mode = viewMode, contractsSource = contracts) => {
    const todayStr = getTodayStr();
    let filtered = contractsSource;

    // Apply upcoming/past filter first
    filtered = filtered.filter((contract) => {
      const endDateStr = contract.endDate.slice(0, 10);
      return mode === "upcoming" ? endDateStr >= todayStr : endDateStr < todayStr;
    });

    if (updatedFilters.groupName) {
      filtered = filtered.filter((contract) =>
        contract.groupName
          .toLowerCase()
          .includes(updatedFilters.groupName.toLowerCase())
      );
    }
    if (updatedFilters.hotelId) {
      filtered = filtered.filter(
        (contract) => contract.hotelId === updatedFilters.hotelId
      );
    }
    if (updatedFilters.startDate) {
      const selectedDate = new Date(updatedFilters.startDate);
      filtered = filtered.filter(
        (contract) =>
          new Date(contract.startDate) <= selectedDate &&
          new Date(contract.endDate) >= selectedDate
      );
    }
    if (updatedFilters.paymentStatus) {
      filtered = filtered.filter((contract) => {
        if (updatedFilters.paymentStatus === "unpaid") {
          return !contract.depositPaid && !contract.paidInFull;
        } else if (updatedFilters.paymentStatus === "deposit-paid") {
          return contract.depositPaid && !contract.paidInFull;
        } else if (updatedFilters.paymentStatus === "paid-in-full") {
          return contract.paidInFull;
        }
        return true;
      });
    }

    // Maintain sorting by start date even after filtering
    const sortedFiltered = [...filtered].sort((a, b) => {
      const dateA = new Date(a.startDate);
      const dateB = new Date(b.startDate);
      return dateA.getTime() - dateB.getTime();
    });

    setFilteredContracts(sortedFiltered);
  };

  const handleArchiveContract = async (contractId: string) => {
    if (confirm("Are you sure you want to archive this contract?")) {
      await archiveGroupContract(contractId);
      fetchContracts();
    }
  };

  const getHotelName = (hotelId: string) => {
    const hotel = hotels.find((h) => h.id === hotelId);
    return hotel ? hotel.name : "Unknown";
  };

  const handleFilterByStatus = (status: string) => {
    const updatedFilters = { ...filters, paymentStatus: status };
    setFilters(updatedFilters);
    applyFilters(updatedFilters);
  };

  const handleViewModeChange = (mode: "upcoming" | "past") => {
    setViewMode(mode);
    applyFilters(filters, mode);
  };

  return (
    <VStack spacing={8} align="stretch">
      {/* Page Header */}
      <Box>
        <Heading size="lg" mb={2}>
          Contracts Overview
        </Heading>
        <Text color="textPrimary">
          Track payment status and manage all your contracts
        </Text>
      </Box>

      {/* Payment Dashboard - Main Entry Point */}
      <Box>
        <PaymentDashboard
          contracts={filteredContracts}
          onFilterByStatus={handleFilterByStatus}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
        />
      </Box>

      {/* Contract Management Section */}
      <Box>
        <Heading size="md" mb={4}>
          Contract Management
        </Heading>
        <VStack spacing={4} align="stretch">
          {/* Action buttons */}
          <Flex gap={3} justify="flex-start">
            <Button onClick={onBack} colorScheme="gray" flex={1}>
              Back
            </Button>
            <Button onClick={onCreateNew} colorScheme="teal" flex={1}>
              New Contract
            </Button>
          </Flex>

          {/* Filters */}
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              Filter Contracts
            </Text>
            <Flex
              gap={2}
              direction={{ base: "column", md: "row" }}
              align="stretch"
            >
              <Input
                placeholder="Filter by Group Name"
                name="groupName"
                value={filters.groupName}
                onChange={handleFilterChange}
              />
              <Select
                placeholder="Filter by Hotel"
                name="hotelId"
                value={filters.hotelId}
                onChange={handleFilterChange}
              >
                {hotels.map((hotel) => (
                  <option key={hotel.id} value={hotel.id}>
                    {hotel.name}
                  </option>
                ))}
              </Select>
              <CustomDatePicker
                selected={filters.startDate ? parseDateOnly(filters.startDate) : null}
                onChange={(date: Date | null) => {
                  handleFilterChange({
                    target: {
                      name: 'startDate' as const,
                      value: date ? toInputDate(date) : ''
                    }
                  } as React.ChangeEvent<HTMLInputElement>);
                }}
                placeholder="Filter by Start Date"
                className="w-48"
              />
            </Flex>
          </Box>

          {/* Contracts List */}
          <Stack spacing={4}>
            {filteredContracts.map((contract) => (
              <Box
                key={contract.id}
                borderWidth="1px"
                borderRadius="lg"
                p={4}
                shadow="sm"
              >
                <Text fontWeight="bold" isTruncated>
                  {contract.groupName}
                </Text>
                <Text color="gray.600" isTruncated>
                  {getHotelName(contract.hotelId)}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {contract.startDate} → {contract.endDate}
                </Text>
                <Text fontSize="xs" color="gray.400">
                  {formatBookingType(contract.bookingType)} ·{" "}
                  {parseDate(contract.createdAt).toLocaleString()}
                </Text>

                <HStack mt={2} spacing={2}>
                  <PaymentStatusBadge contract={contract} size="sm" />
                  {contract.totalCost && (
                    <Text fontSize="sm" fontWeight="medium" color="gray.600">
                      {formatCurrency(contract.totalCost)}
                    </Text>
                  )}
                </HStack>

                <HStack mt={2} spacing={2}>
                  <Button
                    as={NextLink}
                    href={`/contracts/${contract.id}/view`}
                    size="sm"
                    flex="1"
                    variant="outline"
                  >
                    View
                  </Button>
                  <Button
                    size="sm"
                    flex="1"
                    onClick={() => onEditContract(contract)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    flex="1"
                    colorScheme="red"
                    onClick={() => handleArchiveContract(contract.id)}
                  >
                    Archive
                  </Button>
                </HStack>
              </Box>
            ))}

            {filteredContracts.length === 0 && (
              <Text color="gray.500" fontStyle="italic">
                No contracts found.
              </Text>
            )}
          </Stack>
        </VStack>
      </Box>
    </VStack>
  );
}
