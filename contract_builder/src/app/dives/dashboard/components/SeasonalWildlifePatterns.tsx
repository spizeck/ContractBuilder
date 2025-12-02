'use client'

import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  HStack,
  Text,
  VStack,
  Badge,
  useBreakpointValue,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Alert,
  AlertIcon
} from '@chakra-ui/react'
import type { SeasonalWildlifePattern } from '@/types/dashboard'

interface SeasonalWildlifePatternsProps {
  patterns: SeasonalWildlifePattern[]
}

export default function SeasonalWildlifePatterns({ patterns }: SeasonalWildlifePatternsProps) {
  const isMobile = useBreakpointValue({ base: true, md: false })

  if (patterns.length === 0) {
    return (
      <Card>
        <CardHeader>
          <Heading size="md">Seasonal Wildlife Patterns</Heading>
        </CardHeader>
        <CardBody>
          <Text color="gray.500">No wildlife pattern data available</Text>
        </CardBody>
      </Card>
    )
  }

  // Sort patterns by total sightings (descending)
  const sortedPatterns = [...patterns].sort((a, b) => b.totalSightings - a.totalSightings)
  
  // Find peak and low seasons
  const peakSeason = sortedPatterns[0]
  const lowSeason = sortedPatterns[sortedPatterns.length - 1]
  
  // Calculate overall stats
  const totalAnnualSightings = patterns.reduce((sum, pattern) => sum + pattern.totalSightings, 0)
  const avgMonthlySightings = totalAnnualSightings / patterns.length

  // Get unique species across all seasons
  const allSpecies = new Map()
  patterns.forEach(pattern => {
    pattern.species.forEach(species => {
      if (!allSpecies.has(species.id)) {
        allSpecies.set(species.id, { ...species, months: [] })
      }
      allSpecies.get(species.id).months.push(pattern.month)
    })
  })

  const uniqueSpeciesCount = allSpecies.size

  return (
    <Card>
      <CardHeader>
        <VStack align="start" spacing={1}>
          <Heading size="md">Seasonal Wildlife Patterns</Heading>
          <Text fontSize="sm" color="gray.600">
            Species sightings by month to plan wildlife-focused dives
          </Text>
        </VStack>
      </CardHeader>
      <CardBody>
        {/* Season Overview Stats */}
        <SimpleGrid columns={isMobile ? 2 : 4} spacing={4} mb={6}>
          <Stat>
            <StatLabel fontSize="xs" color="gray.600">Peak Season</StatLabel>
            <StatNumber fontSize="lg" color="green.600">
              {peakSeason.month}
            </StatNumber>
            <Text fontSize="xs" color="gray.500">
              {peakSeason.totalSightings} sightings
            </Text>
          </Stat>
          
          <Stat>
            <StatLabel fontSize="xs" color="gray.600">Low Season</StatLabel>
            <StatNumber fontSize="lg" color="orange.600">
              {lowSeason.month}
            </StatNumber>
            <Text fontSize="xs" color="gray.500">
              {lowSeason.totalSightings} sightings
            </Text>
          </Stat>
          
          <Stat>
            <StatLabel fontSize="xs" color="gray.600">Unique Species</StatLabel>
            <StatNumber fontSize="lg">{uniqueSpeciesCount}</StatNumber>
          </Stat>
          
          <Stat>
            <StatLabel fontSize="xs" color="gray.600">Monthly Average</StatLabel>
            <StatNumber fontSize="lg">
              {avgMonthlySightings.toFixed(0)}
            </StatNumber>
          </Stat>
        </SimpleGrid>

        {/* Monthly Patterns Grid */}
        <SimpleGrid columns={isMobile ? 1 : 2} spacing={4} mb={6}>
          {sortedPatterns.map((pattern) => {
            const isPeakSeason = pattern.month === peakSeason.month
            const isLowSeason = pattern.month === lowSeason.month
            
            return (
              <Box
                key={pattern.month}
                p={4}
                borderWidth="1px"
                borderRadius="md"
                bg={isPeakSeason ? 'green.50' : isLowSeason ? 'orange.50' : 'white'}
                borderColor={isPeakSeason ? 'green.200' : isLowSeason ? 'orange.200' : 'gray.200'}
              >
                <HStack justify="space-between" align="start" mb={3}>
                  <VStack align="start" spacing={1}>
                    <Text fontSize="md" fontWeight="bold">
                      {pattern.month}
                    </Text>
                    <HStack spacing={2}>
                      <Badge
                        colorScheme={isPeakSeason ? 'green' : isLowSeason ? 'orange' : 'gray'}
                        variant={isPeakSeason || isLowSeason ? 'solid' : 'subtle'}
                      >
                        {isPeakSeason ? 'Peak' : isLowSeason ? 'Low' : 'Moderate'}
                      </Badge>
                      <Text fontSize="xs" color="gray.600">
                        {pattern.diveCount} dives
                      </Text>
                    </HStack>
                  </VStack>
                  
                  <VStack align="end" spacing={1}>
                    <Text fontSize="lg" fontWeight="bold" color="blue.600">
                      {pattern.totalSightings}
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      total sightings
                    </Text>
                  </VStack>
                </HStack>

                {/* Top Species */}
                <VStack align="start" spacing={2}>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700">
                    Top Species:
                  </Text>
                  <HStack flexWrap="wrap" spacing={1}>
                    {pattern.species.slice(0, 6).map((species) => (
                      <Badge
                        key={species.id}
                        colorScheme="blue"
                        variant="outline"
                        fontSize="xs"
                      >
                        {species.name}
                      </Badge>
                    ))}
                    {pattern.species.length > 6 && (
                      <Badge colorScheme="gray" variant="solid" fontSize="xs">
                        +{pattern.species.length - 6} more
                      </Badge>
                    )}
                  </HStack>
                </VStack>

                {/* Species Categories */}
                {pattern.species.length > 0 && (
                  <Box mt={3}>
                    <Text fontSize="xs" color="gray.600">
                      Categories: {Array.from(new Set(pattern.species.map(s => s.category).filter(Boolean))).join(', ')}
                    </Text>
                  </Box>
                )}
              </Box>
            )
          })}
        </SimpleGrid>

        {/* Wildlife Insights */}
        <VStack spacing={3} align="stretch">
          <Text fontSize="sm" fontWeight="medium">
            Wildlife Planning Insights:
          </Text>
          
          {/* Peak Season Alert */}
          <Alert status="success" borderRadius="md">
            <AlertIcon />
            <Box>
              <Text fontSize="sm" fontWeight="medium">
                Best Wildlife Viewing: {peakSeason.month}
              </Text>
              <Text fontSize="xs" color="gray.600">
                {peakSeason.totalSightings} sightings across {peakSeason.species.length} species
              </Text>
            </Box>
          </Alert>

          {/* Year-round Species */}
          {uniqueSpeciesCount > 0 && (
            <Box p={3} bg="blue.50" borderRadius="md">
              <Text fontSize="sm" fontWeight="medium" color="blue.800" mb={2}>
                Species Diversity:
              </Text>
              <Text fontSize="xs" color="blue.700">
                {uniqueSpeciesCount} different species documented throughout the year
              </Text>
              
              {/* Most common species across all seasons */}
              <Box mt={2}>
                <Text fontSize="xs" color="blue.700" fontWeight="medium">
                  Most Common Species:
                </Text>
                <HStack flexWrap="wrap" spacing={1} mt={1}>
                  {Array.from(allSpecies.entries())
                    .sort((a, b) => b[1].months.length - a[1].months.length)
                    .slice(0, 5)
                    .map(([_, species]) => (
                      <Badge key={species.id} colorScheme="blue" variant="solid" fontSize="xs">
                        {species.name} ({species.months.length} months)
                      </Badge>
                    ))}
                </HStack>
              </Box>
            </Box>
          )}
        </VStack>
      </CardBody>
    </Card>
  )
}
