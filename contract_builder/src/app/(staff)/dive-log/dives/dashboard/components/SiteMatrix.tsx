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
import type { DailySiteMatrix } from '@/app/(staff)/dive-log/_types'
import { formatDiveDate } from '@shared/utils/dateUtils'

interface SiteMatrixProps {
  siteMatrix: DailySiteMatrix[]
}

export default function SiteMatrix({ siteMatrix }: SiteMatrixProps) {
  const isMobile = useBreakpointValue({ base: true, md: false })

  if (siteMatrix.length === 0) {
    return (
      <Card>
        <CardHeader>
          <Heading size="md">7-Day Site Matrix by Boat</Heading>
        </CardHeader>
        <CardBody>
          <Text color="gray.500">No dive activity in the last 7 days</Text>
        </CardBody>
      </Card>
    )
  }

  // Check for boat-specific site repetitions
  const checkForBoatRepetitions = (matrix: DailySiteMatrix[]) => {
    const boatSiteUsage = new Map<string, Map<string, { dates: string[], count: number }>>()
    
    matrix.forEach(day => {
      day.boatSites.forEach(boatEntry => {
        if (!boatSiteUsage.has(boatEntry.boat.id)) {
          boatSiteUsage.set(boatEntry.boat.id, new Map())
        }
        const boatUsage = boatSiteUsage.get(boatEntry.boat.id)!
        
        boatEntry.sites.forEach(site => {
          if (!boatUsage.has(site.id)) {
            boatUsage.set(site.id, { dates: [], count: 0 })
          }
          const usage = boatUsage.get(site.id)!
          usage.dates.push(day.date)
          usage.count++
        })
      })
    })

    const repetitions: { boatId: string, siteId: string, usage: { dates: string[], count: number } }[] = []
    
    boatSiteUsage.forEach((siteMap, boatId) => {
      siteMap.forEach((usage, siteId) => {
        if (usage.count > 1) {
          repetitions.push({ boatId, siteId, usage })
        }
      })
    })

    return repetitions
  }

  const repetitions = checkForBoatRepetitions(siteMatrix)
  
  // Get repetition level for a specific boat and site
  const getRepetitionLevel = (boatId: string, siteId: string) => {
    const repetition = repetitions.find(r => r.boatId === boatId && r.siteId === siteId)
    if (!repetition) return 0
    return repetition.usage.count
  }

  return (
    <Card>
      <CardHeader>
        <VStack align="start" spacing={2}>
          <Heading size="md">7-Day Site Matrix by Boat</Heading>
          <Text fontSize="sm" color="gray.600">
            Shows which sites each boat has visited to prevent repetition
          </Text>
          <HStack spacing={4} fontSize="xs" color="gray.500">
            <HStack spacing={1}>
              <Badge colorScheme="blue" variant="subtle">Blue</Badge>
              <Text>First visit</Text>
            </HStack>
            <HStack spacing={1}>
              <Badge colorScheme="orange" variant="solid">Orange</Badge>
              <Text>2nd visit</Text>
            </HStack>
            <HStack spacing={1}>
              <Badge colorScheme="red" variant="solid">Red</Badge>
              <Text>3rd+ visit</Text>
            </HStack>
          </HStack>
        </VStack>
      </CardHeader>
      <CardBody>
        {repetitions.length > 0 && (
          <Alert status="warning" mb={4} borderRadius="md">
            <AlertIcon />
            <Box>
              <Text fontWeight="medium">Boat Site Repetitions Detected</Text>
              <Text fontSize="sm">
                {repetitions.length} boat-site combination(s) repeated in the last 7 days
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
                        {boatEntry.sites.map((site, index) => {
                          const repetitionLevel = getRepetitionLevel(boatEntry.boat.id, site.id)
                          let colorScheme = "blue"
                          let variant = "subtle"
                          
                          if (repetitionLevel === 2) {
                            colorScheme = "orange"
                            variant = "solid"
                          } else if (repetitionLevel >= 3) {
                            colorScheme = "red"
                            variant = "solid"
                          }
                          
                          return (
                            <Badge
                              key={site.id}
                              colorScheme={colorScheme}
                              variant={variant}
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
                                    const repetitionLevel = getRepetitionLevel(boat.id, site.id)
                                    let colorScheme = "blue"
                                    let variant = "subtle"
                                    
                                    if (repetitionLevel === 2) {
                                      colorScheme = "orange"
                                      variant = "solid"
                                    } else if (repetitionLevel >= 3) {
                                      colorScheme = "red"
                                      variant = "solid"
                                    }
                                    
                                    return (
                                      <Badge
                                        key={site.id}
                                        colorScheme={colorScheme}
                                        variant={variant}
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
              Boat Site Repetitions (Last 7 Days):
            </Text>
            <VStack spacing={1} align="start">
              {repetitions.map(({ boatId, siteId, usage }) => {
                const boat = siteMatrix
                  .flatMap(day => day.boatSites)
                  .find(bs => bs.boat.id === boatId)?.boat
                const site = siteMatrix
                  .flatMap(day => day.boatSites)
                  .flatMap(boatEntry => boatEntry.sites)
                  .find(s => s.id === siteId)
                
                if (!boat || !site) return null
                
                let repetitionText = ""
                if (usage.count === 2) {
                  repetitionText = "(2 visits - orange)"
                } else if (usage.count >= 3) {
                  repetitionText = `(${usage.count}+ visits - red)`
                }
                
                return (
                  <Text key={`${boatId}-${siteId}`} fontSize="xs" color="orange.700">
                    {boat.name} - {site.name}: {usage.count} times {repetitionText}
                  </Text>
                )
              })}
            </VStack>
          </Box>
        )}
      </CardBody>
    </Card>
  )
}
