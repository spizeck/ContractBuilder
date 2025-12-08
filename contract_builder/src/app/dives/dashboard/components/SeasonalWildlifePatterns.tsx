'use client'

import { useState } from 'react'
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
  AlertIcon,
} from '@chakra-ui/react'
import type { SeasonalWildlifePattern } from '@/types/dashboard'

interface SeasonalWildlifePatternsProps {
  patterns: SeasonalWildlifePattern[]
}

export default function SeasonalWildlifePatterns({ patterns }: SeasonalWildlifePatternsProps) {
  const isMobile = useBreakpointValue({ base: true, md: false })

  // Sort patterns by sightings per dive (weighted) for wildlife planning
  const sortedPatterns = [...patterns].sort((a, b) => {
    const aPerDive = a.diveCount > 0 ? a.totalSightings / a.diveCount : 0
    const bPerDive = b.diveCount > 0 ? b.totalSightings / b.diveCount : 0
    return bPerDive - aPerDive
  })
  
  // Find peak and low seasons based on weighted sightings per dive
  const peakSeason = sortedPatterns[0]
  const lowSeason = sortedPatterns[sortedPatterns.length - 1]

  // Calculate overall stats
  const totalAnnualSightings = patterns.reduce((sum, pattern) => sum + pattern.totalSightings, 0)
  const avgMonthlySightings = patterns.length > 0 ? totalAnnualSightings / patterns.length : 0

  // Calculate weighted stats (sightings per dive)
  const totalAnnualDives = patterns.reduce((sum, pattern) => sum + pattern.diveCount, 0)
  const totalSightingsPerDive = totalAnnualDives > 0 ? totalAnnualSightings / totalAnnualDives : 0
  const avgMonthlySightingsPerDive = patterns.length > 0 
    ? patterns.reduce((sum, pattern) => sum + (pattern.diveCount > 0 ? pattern.totalSightings / pattern.diveCount : 0), 0) / patterns.length 
    : 0

  // Get unique species count
  const uniqueSpeciesCount = new Set(patterns.flatMap(p => p.species.map(s => s.id))).size

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

  return (
    <Card>
      <CardHeader>
        <VStack align="start" spacing={1}>
          <Heading size="md">Seasonal Wildlife Patterns</Heading>
          <Text fontSize="sm" color="textMuted">
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
            <Text fontSize="xs" color="gray.400">
              {peakSeason.diveCount > 0 ? (peakSeason.totalSightings / peakSeason.diveCount).toFixed(2) : '0.00'} per dive
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
            <Text fontSize="xs" color="gray.400">
              {lowSeason.diveCount > 0 ? (lowSeason.totalSightings / lowSeason.diveCount).toFixed(2) : '0.00'} per dive
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
            <Text fontSize="xs" color="gray.400">
              {avgMonthlySightingsPerDive.toFixed(2)} per dive
            </Text>
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
                bg={isPeakSeason ? "wildlifePeak" : isLowSeason ? "wildlifeLow" : "cardBg"}
                borderColor={isPeakSeason ? 'green.200' : isLowSeason ? 'orange.200' : 'border'}
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
                      <Text fontSize="xs" color="textMuted">
                        {pattern.diveCount} dives
                      </Text>
                    </HStack>
                  </VStack>
                  
                  <VStack align="end" spacing={1}>
                    <Text fontSize="lg" fontWeight="bold" color="info">
                      {pattern.totalSightings}
                    </Text>
                    <Text fontSize="xs" color="textMuted">
                      total sightings
                    </Text>
                  </VStack>
                </HStack>

                {/* Top Species */}
                <VStack align="start" spacing={2}>
                  <Text fontSize="sm" fontWeight="medium" color="textSecondary">
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
              <Text fontSize="xs" color="textMuted">
                {peakSeason.totalSightings} sightings across {peakSeason.species.length} species
              </Text>
            </Box>
          </Alert>

          {/* Year-round Species */}
          {uniqueSpeciesCount > 0 && (
            <Box p={3} bg="speciesDiversity" borderRadius="md">
              <Text fontSize="sm" fontWeight="medium" color="infoTitle" mb={2}>
                Species Diversity:
              </Text>
              <Text fontSize="xs" color="infoText">
                {uniqueSpeciesCount} different species documented throughout the year
              </Text>
            </Box>
          )}
        </VStack>
      </CardBody>
    </Card>
  )
}
