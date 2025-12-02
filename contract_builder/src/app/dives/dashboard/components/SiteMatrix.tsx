'use client'

import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  HStack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  Badge,
  useBreakpointValue,
  Alert,
  AlertIcon
} from '@chakra-ui/react'
import type { DailySiteMatrix } from '@/types/dashboard'
import { formatDiveDate } from '@/utils/dateUtils'

interface SiteMatrixProps {
  siteMatrix: DailySiteMatrix[]
}

export default function SiteMatrix({ siteMatrix }: SiteMatrixProps) {
  const isMobile = useBreakpointValue({ base: true, md: false })

  if (siteMatrix.length === 0) {
    return (
      <Card>
        <CardHeader>
          <Heading size="md">7-Day Site Matrix</Heading>
        </CardHeader>
        <CardBody>
          <Text color="gray.500">No dive activity in the last 7 days</Text>
        </CardBody>
      </Card>
    )
  }

  // Check for potential site repetitions
  const checkForRepetitions = (matrix: DailySiteMatrix[]) => {
    const siteUsage = new Map<string, { dates: string[], boats: string[] }>()
    
    matrix.forEach(day => {
      day.boatSites.forEach(boatEntry => {
        boatEntry.sites.forEach(site => {
          const key = site.id
          if (!siteUsage.has(key)) {
            siteUsage.set(key, { dates: [], boats: [] })
          }
          const usage = siteUsage.get(key)!
          usage.dates.push(day.date)
          usage.boats.push(boatEntry.boat.name)
        })
      })
    })

    const repetitions = Array.from(siteUsage.entries())
      .filter(([_, usage]) => usage.dates.length > 1)
      .map(([siteId, usage]) => ({ siteId, usage }))

    return repetitions
  }

  const repetitions = checkForRepetitions(siteMatrix)

  return (
    <Card>
      <CardHeader>
        <VStack align="start" spacing={2}>
          <Heading size="md">7-Day Site Matrix by Boat</Heading>
          <Text fontSize="sm" color="gray.600">
            Shows which sites each boat has visited to prevent repetition
          </Text>
        </VStack>
      </CardHeader>
      <CardBody>
        {repetitions.length > 0 && (
          <Alert status="warning" mb={4} borderRadius="md">
            <AlertIcon />
            <Box>
              <Text fontWeight="medium">Site Repetitions Detected</Text>
              <Text fontSize="sm">
                {repetitions.length} site(s) used multiple times in the last 7 days
              </Text>
            </Box>
          </Alert>
        )}

        {isMobile ? (
          // Mobile View - Cards
          <VStack spacing={4} align="stretch">
            {siteMatrix.map((day) => (
              <Box key={day.date} borderWidth="1px" borderRadius="md" p={4}>
                <Heading size="sm" mb={3}>
                  {formatDiveDate(new Date(day.date))}
                </Heading>
                <VStack spacing={2} align="stretch">
                  {day.boatSites.map((boatEntry) => (
                    <Box key={boatEntry.boat.id}>
                      <Text fontWeight="medium" color="blue.600" mb={1}>
                        {boatEntry.boat.name}
                      </Text>
                      <HStack flexWrap="wrap" spacing={2}>
                        {boatEntry.sites.map((site) => {
                          const isRepeated = repetitions.some(r => r.siteId === site.id)
                          return (
                            <Badge
                              key={site.id}
                              colorScheme={isRepeated ? "orange" : "blue"}
                              variant={isRepeated ? "solid" : "subtle"}
                            >
                              {site.name}
                            </Badge>
                          )
                        })}
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              </Box>
            ))}
          </VStack>
        ) : (
          // Desktop View - Table
          <Box overflowX="auto">
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Date</Th>
                  {Array.from(new Set(siteMatrix.flatMap(day => day.boatSites.map(bs => bs.boat))))
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(boat => (
                      <Th key={boat.id}>{boat.name}</Th>
                    ))}
                </Tr>
              </Thead>
              <Tbody>
                {siteMatrix.map((day) => {
                  const boatMap = new Map(day.boatSites.map(bs => [bs.boat.id, bs]))
                  
                  return (
                    <Tr key={day.date}>
                      <Td fontWeight="medium">
                        {formatDiveDate(new Date(day.date))}
                      </Td>
                      {Array.from(new Set(siteMatrix.flatMap(day => day.boatSites.map(bs => bs.boat))))
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map(boat => {
                          const boatEntry = boatMap.get(boat.id)
                          return (
                            <Td key={boat.id}>
                              {boatEntry ? (
                                <HStack spacing={1} flexWrap="wrap">
                                  {boatEntry.sites.map((site) => {
                                    const isRepeated = repetitions.some(r => r.siteId === site.id)
                                    return (
                                      <Badge
                                        key={site.id}
                                        colorScheme={isRepeated ? "orange" : "blue"}
                                        variant={isRepeated ? "solid" : "subtle"}
                                        fontSize="xs"
                                      >
                                        {site.name}
                                      </Badge>
                                    )
                                  })}
                                </HStack>
                              ) : (
                                <Text color="gray.400">-</Text>
                              )}
                            </Td>
                          )
                        })}
                    </Tr>
                  )
                })}
              </Tbody>
            </Table>
          </Box>
        )}

        {repetitions.length > 0 && (
          <Box mt={4} p={3} bg="orange.50" borderRadius="md">
            <Text fontSize="sm" fontWeight="medium" color="orange.800" mb={2}>
              Repeated Sites:
            </Text>
            <VStack spacing={1} align="start">
              {repetitions.map(({ siteId, usage }) => {
                const site = siteMatrix
                  .flatMap(day => day.boatSites)
                  .flatMap(boatEntry => boatEntry.sites)
                  .find(s => s.id === siteId)
                
                return site ? (
                  <Text key={siteId} fontSize="xs" color="orange.700">
                    {site.name}: Used on {usage.dates.length} different days
                  </Text>
                ) : null
              })}
            </VStack>
          </Box>
        )}
      </CardBody>
    </Card>
  )
}
