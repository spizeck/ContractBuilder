'use client'

import {
  Box,
  Card,
  CardBody,
  Heading,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  VStack,
  Progress,
  useBreakpointValue,
  Button,
  ButtonGroup
} from '@chakra-ui/react'
import type { DiveDashboardStats } from '@/types/dashboard'

interface SummaryCardsProps {
  stats: DiveDashboardStats
  statsLast30Days: DiveDashboardStats
  statsCurrentYear: DiveDashboardStats
  onPeriodChange: (period: 'allTime' | 'last30days' | 'currentYear') => void
  currentPeriod: 'allTime' | 'last30days' | 'currentYear'
}

export default function SummaryCards({ 
  stats, 
  statsLast30Days, 
  statsCurrentYear, 
  onPeriodChange, 
  currentPeriod 
}: SummaryCardsProps) {
  const isMobile = useBreakpointValue({ base: true, md: false })

  const getPeriodStats = () => {
    switch (currentPeriod) {
      case 'last30days':
        return statsLast30Days
      case 'currentYear':
        return statsCurrentYear
      default:
        return stats
    }
  }

  const periodStats = getPeriodStats()
  const celsiusToFahrenheit = (celsius: number) => {
    return Math.round((celsius * 9/5 + 32) * 10) / 10
  }

  return (
    <Box>
      <Heading size="md" mb={4}>Summary Statistics</Heading>
      <HStack
        spacing={4}
        align="stretch"
        overflowX="auto"
        pb={2}
        flexWrap={isMobile ? 'wrap' : 'nowrap'}
      >
        {/* Total Dives */}
        <Card minW="200px" flex="1">
          <CardBody>
            <Stat>
              <StatLabel fontSize="sm">Total Dives Logged</StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold">
                {stats.totalDives.toLocaleString()}
              </StatNumber>
            </Stat>
          </CardBody>
        </Card>

        {/* Last 7 Days */}
        <Card minW="200px" flex="1">
          <CardBody>
            <Stat>
              <StatLabel fontSize="sm">Last 7 Days</StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" color="blue.600">
                {stats.divesLast7Days}
              </StatNumber>
            </Stat>
          </CardBody>
        </Card>

        {/* Average Temperature */}
        <Card minW="200px" flex="1">
          <CardBody>
            <Stat>
              <StatLabel fontSize="sm">Avg Temperature (Last 14 Days)</StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" color="orange.600">
                {stats.averageTemperature}°C / {celsiusToFahrenheit(stats.averageTemperature)}°F
              </StatNumber>
            </Stat>
          </CardBody>
        </Card>

        {/* Top Boat */}
        {statsLast30Days.divesByBoat.length > 0 && (
          <Card minW="250px" flex="1">
            <CardBody>
              <VStack align="start" spacing={2}>
                <Text fontSize="sm">Top Boat (Last 30 Days)</Text>
                <Heading size="md">{statsLast30Days.divesByBoat[0].boat.name}</Heading>
                <Text fontSize="sm" color="gray.500">
                  {statsLast30Days.divesByBoat[0].diveCount} dives ({statsLast30Days.divesByBoat[0].percentage.toFixed(1)}%)
                </Text>
                <Progress
                  value={statsLast30Days.divesByBoat[0].percentage}
                  size="sm"
                  colorScheme="blue"
                  w="full"
                  rounded="md"
                />
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Top Guide */}
        {statsLast30Days.divesByGuide.length > 0 && (
          <Card minW="250px" flex="1">
            <CardBody>
              <VStack align="start" spacing={2}>
                <Text fontSize="sm">Top Guide (Last 30 Days)</Text>
                <Heading size="md">{statsLast30Days.divesByGuide[0].guide.name}</Heading>
                <Text fontSize="sm" color="gray.500">
                  {statsLast30Days.divesByGuide[0].diveCount} dives ({statsLast30Days.divesByGuide[0].percentage.toFixed(1)}%)
                </Text>
                <Progress
                  value={statsLast30Days.divesByGuide[0].percentage}
                  size="sm"
                  colorScheme="green"
                  w="full"
                  rounded="md"
                />
              </VStack>
            </CardBody>
          </Card>
        )}
      </HStack>

      {/* Boat and Guide Breakdown */}
      <Box mt={6}>
        <HStack mb={3} spacing={3} align="center">
          <Heading size="sm">Boats & Guides Statistics</Heading>
          <ButtonGroup size="sm" isAttached variant="outline">
            <Button 
              onClick={() => onPeriodChange('allTime')}
              isActive={currentPeriod === 'allTime'}
              bg={currentPeriod === 'allTime' ? 'blue.500' : undefined}
              color={currentPeriod === 'allTime' ? 'white' : undefined}
              _hover={{ bg: currentPeriod === 'allTime' ? 'blue.600' : undefined }}
              _active={{ bg: 'blue.500' }}
            >
              All Time
            </Button>
            <Button 
              onClick={() => onPeriodChange('last30days')}
              isActive={currentPeriod === 'last30days'}
              bg={currentPeriod === 'last30days' ? 'blue.500' : undefined}
              color={currentPeriod === 'last30days' ? 'white' : undefined}
              _hover={{ bg: currentPeriod === 'last30days' ? 'blue.600' : undefined }}
              _active={{ bg: 'blue.500' }}
            >
              Last 30 Days
            </Button>
            <Button 
              onClick={() => onPeriodChange('currentYear')}
              isActive={currentPeriod === 'currentYear'}
              bg={currentPeriod === 'currentYear' ? 'blue.500' : undefined}
              color={currentPeriod === 'currentYear' ? 'white' : undefined}
              _hover={{ bg: currentPeriod === 'currentYear' ? 'blue.600' : undefined }}
              _active={{ bg: 'blue.500' }}
            >
              Current Year
            </Button>
          </ButtonGroup>
        </HStack>
        
        <HStack spacing={6} align="start" flexWrap="wrap">
          {/* All Boats */}
          {periodStats.divesByBoat.length > 1 && (
            <Box flex="1" minW="300px">
              <Heading size="sm" mb={3}>All Boats ({currentPeriod === 'allTime' ? 'All Time' : currentPeriod === 'last30days' ? 'Last 30 Days' : 'Current Year'})</Heading>
              <VStack align="stretch" spacing={2}>
                {periodStats.divesByBoat.slice(0, 5).map((boatStat, index) => (
                  <HStack key={boatStat.boat.id} justify="space-between">
                    <Text fontSize="sm">{boatStat.boat.name}</Text>
                    <HStack spacing={2}>
                      <Text fontSize="sm" fontWeight="medium">
                        {boatStat.diveCount}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        ({boatStat.percentage.toFixed(1)}%)
                      </Text>
                    </HStack>
                  </HStack>
                ))}
              </VStack>
            </Box>
          )}

          {/* All Guides */}
          {periodStats.divesByGuide.length > 1 && (
            <Box flex="1" minW="300px">
              <Heading size="sm" mb={3}>All Guides ({currentPeriod === 'allTime' ? 'All Time' : currentPeriod === 'last30days' ? 'Last 30 Days' : 'Current Year'})</Heading>
              <VStack align="stretch" spacing={2}>
                {periodStats.divesByGuide.slice(0, 5).map((guideStat, index) => (
                  <HStack key={guideStat.guide.id} justify="space-between">
                    <Text fontSize="sm">{guideStat.guide.name}</Text>
                    <HStack spacing={2}>
                      <Text fontSize="sm" fontWeight="medium">
                        {guideStat.diveCount}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        ({guideStat.percentage.toFixed(1)}%)
                      </Text>
                    </HStack>
                  </HStack>
                ))}
              </VStack>
            </Box>
          )}
        </HStack>
      </Box>
    </Box>
  )
}
