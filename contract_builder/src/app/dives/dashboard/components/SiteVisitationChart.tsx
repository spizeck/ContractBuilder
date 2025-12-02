'use client'

import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  HStack,
  Progress,
  Text,
  VStack,
  Badge,
  useBreakpointValue,
  Stat,
  StatLabel,
  StatNumber
} from '@chakra-ui/react'
import type { SiteVisitationData } from '@/types/dashboard'
import { formatDiveDate } from '@/utils/dateUtils'

interface SiteVisitationChartProps {
  visitation: SiteVisitationData[]
}

export default function SiteVisitationChart({ visitation }: SiteVisitationChartProps) {
  const isMobile = useBreakpointValue({ base: true, md: false })

  if (visitation.length === 0) {
    return (
      <Card>
        <CardHeader>
          <Heading size="md">Site Visitation</Heading>
        </CardHeader>
        <CardBody>
          <Text color="gray.500">No site visitation data available</Text>
        </CardBody>
      </Card>
    )
  }

  const topSites = visitation.slice(0, isMobile ? 8 : 10)
  const totalVisits = visitation.reduce((sum, site) => sum + site.visitCount, 0)
  const uniqueSites = visitation.length

  // Categorize sites by visitation frequency
  const frequentSites = visitation.filter(s => s.percentage >= 15)
  const moderateSites = visitation.filter(s => s.percentage >= 5 && s.percentage < 15)
  const rareSites = visitation.filter(s => s.percentage < 5)

  return (
    <Card>
      <CardHeader>
        <VStack align="start" spacing={1}>
          <Heading size="md">Site Visitation Patterns</Heading>
          <Text fontSize="sm" color="gray.600">
            Most and least visited dive sites
          </Text>
        </VStack>
      </CardHeader>
      <CardBody>
        {/* Quick Stats */}
        <HStack spacing={6} mb={6} flexWrap="wrap">
          <Stat>
            <StatLabel fontSize="xs" color="gray.600">Unique Sites</StatLabel>
            <StatNumber fontSize="lg">{uniqueSites}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel fontSize="xs" color="gray.600">Total Visits</StatLabel>
            <StatNumber fontSize="lg">{totalVisits}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel fontSize="xs" color="gray.600">Top Site</StatLabel>
            <StatNumber fontSize="lg">{topSites[0]?.percentage.toFixed(1)}%</StatNumber>
          </Stat>
        </HStack>

        {/* Site Distribution Categories */}
        <HStack spacing={4} mb={6} flexWrap="wrap">
          <Badge colorScheme="red" variant="solid">Frequent (&gt;=15%)</Badge>
          <Badge colorScheme="yellow" variant="solid">Moderate (5-15%)</Badge>
          <Badge colorScheme="green" variant="solid">Rare (&lt;5%)</Badge>
        </HStack>

        {/* Top Sites List */}
        <VStack spacing={3} align="stretch">
          <Text fontSize="sm" fontWeight="medium">Top Visited Sites</Text>
          
          {topSites.map((siteData, index) => {
            const isFrequent = siteData.percentage >= 15
            const isModerate = siteData.percentage >= 5 && siteData.percentage < 15
            const isRare = siteData.percentage < 5
            
            return (
              <Box key={siteData.site.id}>
                <HStack justify="space-between" mb={1}>
                  <HStack spacing={2}>
                    <Text fontSize="sm" fontWeight="medium">
                      {index + 1}. {siteData.site.name}
                    </Text>
                    {siteData.site.protectedArea && (
                      <Badge colorScheme="blue" variant="outline" fontSize="xs">
                        Protected
                      </Badge>
                    )}
                  </HStack>
                  <HStack spacing={2}>
                    <Text fontSize="sm" fontWeight="medium">
                      {siteData.visitCount}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      ({siteData.percentage.toFixed(1)}%)
                    </Text>
                  </HStack>
                </HStack>
                
                <HStack spacing={2} align="center">
                  <Progress
                    value={siteData.percentage}
                    size="sm"
                    colorScheme={
                      isFrequent ? 'red' : isModerate ? 'yellow' : 'green'
                    }
                    w="full"
                    rounded="md"
                  />
                  <Text fontSize="xs" color="gray.500" minW="80px" textAlign="right">
                    Last: {formatDiveDate(siteData.lastVisited)}
                  </Text>
                </HStack>
                
                {siteData.site.region && (
                  <Text fontSize="xs" color="gray.600" mt={1}>
                    Region: {siteData.site.region}
                    {siteData.site.habitatType && ` • ${siteData.site.habitatType}`}
                  </Text>
                )}
              </Box>
            )
          })}
        </VStack>

        {/* Site Categories Summary */}
        <Box mt={6} p={3} bg="gray.50" borderRadius="md">
          <Text fontSize="sm" fontWeight="medium" mb={2} color="gray.700">
            Site Distribution:
          </Text>
          <HStack spacing={4} flexWrap="wrap">
            <Text fontSize="xs" color="gray.600">
              Frequent: {frequentSites.length} sites
            </Text>
            <Text fontSize="xs" color="gray.600">
              Moderate: {moderateSites.length} sites
            </Text>
            <Text fontSize="xs" color="gray.600">
              Rare: {rareSites.length} sites
            </Text>
          </HStack>
        </Box>

        {/* Underutilized Sites Alert */}
        {rareSites.length > 0 && (
          <Box mt={4} p={3} bg="blue.50" borderRadius="md">
            <Text fontSize="sm" fontWeight="medium" color="blue.800" mb={1}>
              Site Diversity Opportunity
            </Text>
            <Text fontSize="xs" color="blue.700">
              {rareSites.length} sites visited less frequently - consider rotating to these locations
            </Text>
          </Box>
        )}
      </CardBody>
    </Card>
  )
}
