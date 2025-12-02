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
  useBreakpointValue
} from '@chakra-ui/react'
import type { DiveDashboardStats } from '@/types/dashboard'

interface SummaryCardsProps {
  stats: DiveDashboardStats
}

export default function SummaryCards({ stats }: SummaryCardsProps) {
  const isMobile = useBreakpointValue({ base: true, md: false })

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
              <StatLabel fontSize="sm" color="gray.600">Total Dives</StatLabel>
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
              <StatLabel fontSize="sm" color="gray.600">Last 7 Days</StatLabel>
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
              <StatLabel fontSize="sm" color="gray.600">Avg Temperature</StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" color="orange.600">
                {stats.averageTemperature}°C
              </StatNumber>
            </Stat>
          </CardBody>
        </Card>

        {/* Top Boat */}
        {stats.divesByBoat.length > 0 && (
          <Card minW="250px" flex="1">
            <CardBody>
              <VStack align="start" spacing={2}>
                <Text fontSize="sm" color="gray.600">Top Boat</Text>
                <Heading size="md">{stats.divesByBoat[0].boat.name}</Heading>
                <Text fontSize="sm" color="gray.500">
                  {stats.divesByBoat[0].diveCount} dives ({stats.divesByBoat[0].percentage.toFixed(1)}%)
                </Text>
                <Progress
                  value={stats.divesByBoat[0].percentage}
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
        {stats.divesByGuide.length > 0 && (
          <Card minW="250px" flex="1">
            <CardBody>
              <VStack align="start" spacing={2}>
                <Text fontSize="sm" color="gray.600">Top Guide</Text>
                <Heading size="md">{stats.divesByGuide[0].guide.name}</Heading>
                <Text fontSize="sm" color="gray.500">
                  {stats.divesByGuide[0].diveCount} dives ({stats.divesByGuide[0].percentage.toFixed(1)}%)
                </Text>
                <Progress
                  value={stats.divesByGuide[0].percentage}
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
      <HStack mt={6} spacing={6} align="start" flexWrap="wrap">
        {/* All Boats */}
        {stats.divesByBoat.length > 1 && (
          <Box flex="1" minW="300px">
            <Heading size="sm" mb={3}>All Boats</Heading>
            <VStack align="stretch" spacing={2}>
              {stats.divesByBoat.slice(0, 5).map((boatStat, index) => (
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
        {stats.divesByGuide.length > 1 && (
          <Box flex="1" minW="300px">
            <Heading size="sm" mb={3}>All Guides</Heading>
            <VStack align="stretch" spacing={2}>
              {stats.divesByGuide.slice(0, 5).map((guideStat, index) => (
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
  )
}
