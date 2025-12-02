'use client'

import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  VStack,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  useBreakpointValue
} from '@chakra-ui/react'
import type { TemperatureTrend } from '@/types/dashboard'
import { formatDiveDate } from '@/utils/dateUtils'

interface TemperatureChartProps {
  trends: TemperatureTrend[]
}

export default function TemperatureChart({ trends }: TemperatureChartProps) {
  const isMobile = useBreakpointValue({ base: true, md: false })
  
  const celsiusToFahrenheit = (celsius: number) => {
    return Math.round((celsius * 9/5 + 32) * 10) / 10
  }

  if (trends.length === 0) {
    return (
      <Card>
        <CardHeader>
          <Heading size="md">Temperature Trends</Heading>
        </CardHeader>
        <CardBody>
          <Text color="gray.500">No temperature data available</Text>
        </CardBody>
      </Card>
    )
  }

  const sortedTrends = [...trends].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const latestTemp = sortedTrends[sortedTrends.length - 1]?.temperature || 0
  const avgTemp = sortedTrends.reduce((sum, trend) => sum + trend.temperature, 0) / sortedTrends.length
  const maxTemp = Math.max(...sortedTrends.map(t => t.temperature))
  const minTemp = Math.min(...sortedTrends.map(t => t.temperature))

  // Simple bar chart visualization using Chakra UI components
  const maxBarHeight = 100
  const tempRange = maxTemp - minTemp || 1

  return (
    <Card>
      <CardHeader>
        <VStack align="start" spacing={1}>
          <Heading size="md">Temperature Trends (Last 30 Days)</Heading>
          <Text fontSize="sm" color="gray.600">
            Water temperature patterns over time
          </Text>
        </VStack>
      </CardHeader>
      <CardBody>
        {/* Temperature Stats */}
        <HStack spacing={6} mb={6} flexWrap="wrap">
          <Stat>
            <StatLabel fontSize="xs" color="gray.600">Current</StatLabel>
            <StatNumber fontSize="lg" color="orange.600">
              {latestTemp}°C / {celsiusToFahrenheit(latestTemp)}°F
            </StatNumber>
          </Stat>
          <Stat>
            <StatLabel fontSize="xs" color="gray.600">Average</StatLabel>
            <StatNumber fontSize="lg">
              {avgTemp.toFixed(1)}°C / {celsiusToFahrenheit(avgTemp)}°F
            </StatNumber>
          </Stat>
          <Stat>
            <StatLabel fontSize="xs" color="gray.600">Range</StatLabel>
            <StatNumber fontSize="lg">
              {minTemp.toFixed(1)}° - {maxTemp.toFixed(1)}°C
            </StatNumber>
            <Text fontSize="xs" color="gray.600" textAlign="center">
              {celsiusToFahrenheit(minTemp)}° - {celsiusToFahrenheit(maxTemp)}°F
            </Text>
          </Stat>
        </HStack>

        {/* Temperature Chart */}
        <Box>
          <Text fontSize="sm" fontWeight="medium" mb={3}>Daily Temperatures</Text>
          
          {isMobile ? (
            // Mobile: Show last 7 days
            <VStack spacing={2} align="stretch">
              {sortedTrends.slice(-7).map((trend) => (
                <HStack key={trend.date} justify="space-between" align="center">
                  <Text fontSize="xs" color="gray.600" minW="60px">
                    {formatDiveDate(new Date(trend.date))}
                  </Text>
                  <Box flex="1" px={2}>
                    <HStack spacing={2} align="center">
                      <Box
                        h="20px"
                        bg="orange.400"
                        borderRadius="sm"
                        width={`${((trend.temperature - minTemp) / tempRange) * 100}%`}
                        minW="2px"
                      />
                      <Text fontSize="xs" fontWeight="medium" minW="60px">
                        {trend.temperature}°C / {celsiusToFahrenheit(trend.temperature)}°F
                      </Text>
                    </HStack>
                  </Box>
                </HStack>
              ))}
            </VStack>
          ) : (
            // Desktop: Show bar chart
            <Box>
              {/* Y-axis labels */}
              <HStack spacing={0} align="flex-end" mb={2}>
                <Box minW="40px">
                  <Text fontSize="xs" color="gray.600" textAlign="right">
                    {maxTemp.toFixed(1)}°C
                  </Text>
                  <Text fontSize="xs" color="gray.500" textAlign="right">
                    {celsiusToFahrenheit(maxTemp)}°F
                  </Text>
                </Box>
                <Box flex="1" h="4px" bg="gray.200" borderRadius="sm" />
              </HStack>

              {/* Chart bars */}
              <HStack spacing={1} align="flex-end" h={maxBarHeight}>
                {sortedTrends.slice(-14).map((trend) => (
                  <VStack key={trend.date} flex="1" spacing={0}>
                    <Box
                      w="full"
                      bg="orange.400"
                      borderRadius="sm"
                      h={`${((trend.temperature - minTemp) / tempRange) * maxBarHeight}px`}
                      title={`${formatDiveDate(new Date(trend.date))}: ${trend.temperature}°C / ${celsiusToFahrenheit(trend.temperature)}°F (${trend.diveCount} dives)`}
                    />
                  </VStack>
                ))}
              </HStack>

              {/* X-axis labels */}
              <HStack spacing={1} mt={2}>
                {sortedTrends.slice(-14).map((trend) => (
                  <Box key={trend.date} flex="1">
                    <Text fontSize="xs" color="gray.600" textAlign="center">
                      {new Date(trend.date).getDate()}
                    </Text>
                  </Box>
                ))}
              </HStack>

              {/* Min temp label */}
              <HStack spacing={0} align="flex-start" mt={2}>
                <Box minW="40px">
                  <Text fontSize="xs" color="gray.600" textAlign="right">
                    {minTemp.toFixed(1)}°C
                  </Text>
                  <Text fontSize="xs" color="gray.500" textAlign="right">
                    {celsiusToFahrenheit(minTemp)}°F
                  </Text>
                </Box>
                <Box flex="1" h="4px" bg="gray.200" borderRadius="sm" />
              </HStack>
            </Box>
          )}

          {/* Legend */}
          <Box mt={4} p={2} bg="gray.50" borderRadius="md">
            <Text fontSize="xs" color="gray.600">
              Showing last {isMobile ? '7' : '14'} days of temperature data
            </Text>
          </Box>
        </Box>
      </CardBody>
    </Card>
  )
}
