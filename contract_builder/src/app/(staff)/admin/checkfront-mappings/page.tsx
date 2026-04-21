'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  VStack,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  Select,
  HStack,
} from '@chakra-ui/react'
import ProtectedRoute from '@shared/components/LayoutComponents/ProtectedRoute'
import { CheckfrontItemMapping } from '@/app/(staff)/contracts/_types'
import { getCheckfrontItemMappings } from '@/app/(staff)/contracts/_lib/checkfrontRepo'
import { getHotels } from '@/app/(staff)/contracts/_lib/hotelsRepo'
import { Hotel } from '@/app/(staff)/contracts/_types'

export default function CheckfrontMappingsPage() {
  return (
    <ProtectedRoute adminOnly>
      <CheckfrontMappingsContent />
    </ProtectedRoute>
  )
}

function CheckfrontMappingsContent() {
  const [mappings, setMappings] = useState<CheckfrontItemMapping[]>([])
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedHotelId, setSelectedHotelId] = useState<string>('all')

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [mappingsData, hotelsData] = await Promise.all([
          getCheckfrontItemMappings(),
          getHotels(),
        ])
        setMappings(mappingsData)
        setHotels(hotelsData.filter(h => !h.archived))
      } catch (err) {
        console.error('Error loading Checkfront mappings:', err)
        setError('Failed to load mappings. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const filteredMappings = selectedHotelId === 'all'
    ? mappings
    : mappings.filter(m => m.hotelId === selectedHotelId || (!m.hotelId && selectedHotelId === 'global'))

  const getHotelName = (hotelId?: string | null) => {
    if (!hotelId) return 'Global'
    const hotel = hotels.find(h => h.id === hotelId)
    return hotel?.name || `Hotel ${hotelId.slice(0, 6)}...`
  }

  const getEntityTypeColor = (type: CheckfrontItemMapping['localEntityType']) => {
    switch (type) {
      case 'hotel': return 'blue'
      case 'roomCategory': return 'green'
      case 'roomType': return 'teal'
      case 'mealPackage': return 'orange'
      case 'divePackage': return 'purple'
      case 'addon': return 'gray'
      default: return 'gray'
    }
  }

  const getItemTypeColor = (type: CheckfrontItemMapping['itemType']) => {
    switch (type) {
      case 'room': return 'green'
      case 'dive': return 'blue'
      case 'meal': return 'orange'
      case 'addon': return 'gray'
      default: return 'gray'
    }
  }

  return (
    <Box p={6} maxW="1200px" mx="auto">
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading as="h1" size="lg" mb={2}>
            Checkfront Item Mappings
          </Heading>
          <Text color="textMuted" fontSize="sm">
            View mappings between business app entities and Checkfront items.
            Mappings are used to sync contracts with Checkfront bookings.
          </Text>
        </Box>

        <HStack>
          <Text fontWeight="medium">Filter by Hotel:</Text>
          <Select
            value={selectedHotelId}
            onChange={(e) => setSelectedHotelId(e.target.value)}
            w="250px"
            size="sm"
          >
            <option value="all">All Hotels</option>
            <option value="global">Global (No Hotel)</option>
            {hotels.map(hotel => (
              <option key={hotel.id} value={hotel.id}>
                {hotel.name}
              </option>
            ))}
          </Select>
        </HStack>

        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {loading ? (
          <Box textAlign="center" py={10}>
            <Spinner size="xl" />
            <Text mt={4}>Loading mappings...</Text>
          </Box>
        ) : filteredMappings.length === 0 ? (
          <Alert status="info">
            <AlertIcon />
            No mappings found. Mappings will be created when configuring Checkfront integration.
          </Alert>
        ) : (
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>Entity Type</Th>
                <Th>Hotel</Th>
                <Th>Local Entity ID</Th>
                <Th>Checkfront Item ID</Th>
                <Th>Item Type</Th>
                <Th>Status</Th>
                <Th>Rate Source</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredMappings.map((mapping) => (
                <Tr key={mapping.id} opacity={mapping.active ? 1 : 0.5}>
                  <Td>
                    <Badge colorScheme={getEntityTypeColor(mapping.localEntityType)}>
                      {mapping.localEntityType}
                    </Badge>
                  </Td>
                  <Td>{getHotelName(mapping.hotelId)}</Td>
                  <Td fontSize="xs" fontFamily="mono">
                    {mapping.localEntityId.slice(0, 12)}...
                  </Td>
                  <Td fontSize="xs" fontFamily="mono">
                    {mapping.checkfrontItemId}
                  </Td>
                  <Td>
                    <Badge colorScheme={getItemTypeColor(mapping.itemType)}>
                      {mapping.itemType}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge colorScheme={mapping.active ? 'green' : 'red'}>
                      {mapping.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </Td>
                  <Td>{mapping.rateSource || 'manual_map'}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}

        <Box pt={4} borderTop="1px" borderColor="border">
          <Text fontSize="sm" color="textMuted">
            <strong>TODO:</strong> Full Checkfront mapping management UI will be implemented in Phase 2.
            This page is currently read-only.
          </Text>
        </Box>
      </VStack>
    </Box>
  )
}
