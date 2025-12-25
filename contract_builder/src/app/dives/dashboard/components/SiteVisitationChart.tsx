"use client";

import { useState, useEffect } from "react";
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
  StatNumber,
  Button,
  ButtonGroup,
  Spinner,
} from "@chakra-ui/react";
import type { SiteVisitationData } from "@/types/dashboard";
import { formatDiveDate } from "@/utils/datetime";
import { getSiteVisitation } from "@/services/diveDashboard";
import ChartHeader from "./ChartHeader";

interface SiteVisitationChartProps {
  visitation: SiteVisitationData[];
}

type TimePeriod = "30days" | "90days" | "12months";

export default function SiteVisitationChart({
  visitation,
}: SiteVisitationChartProps) {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("30days");
  const [periodVisitation, setPeriodVisitation] =
    useState<SiteVisitationData[]>(visitation);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPeriodData = async () => {
      setLoading(true);
      try {
        const data = await getSiteVisitation(selectedPeriod);
        setPeriodVisitation(data);
      } catch (error) {
        console.error("Failed to fetch site visitation data:", error);
        // Fallback to client-side filtering if API fails
        const filtered = filterDataByPeriod(visitation, selectedPeriod);
        setPeriodVisitation(filtered);
      } finally {
        setLoading(false);
      }
    };

    fetchPeriodData();
  }, [selectedPeriod]);

  const filterDataByPeriod = (
    data: SiteVisitationData[],
    period: TimePeriod
  ) => {
    // For now, we'll use the same data since the API doesn't support period filtering
    // In a real implementation, you would filter based on the last visited date
    return data;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <ChartHeader
            title="Site Visitation Patterns"
            description="Most and least visited dive sites"
            selectedPeriod={selectedPeriod}
            periods={[
              { value: "30days", label: "30 Days" },
              { value: "90days", label: "90 Days" },
              { value: "12months", label: "12 Months" },
            ]}
            onPeriodChange={(period) => setSelectedPeriod(period as TimePeriod)}
          />
        </CardHeader>
        <CardBody
          display="flex"
          justifyContent="center"
          alignItems="center"
          minH="300px"
        >
          <VStack spacing={4}>
            <Spinner size="xl" color="infoLink" />
            <Text color="textMuted">Loading site visitation data...</Text>
          </VStack>
        </CardBody>
      </Card>
    );
  }

  if (periodVisitation.length === 0) {
    return (
      <Card>
        <CardHeader>
          <ChartHeader
            title="Site Visitation Patterns"
            description="Most and least visited dive sites"
            selectedPeriod={selectedPeriod}
            periods={[
              { value: "30days", label: "30 Days" },
              { value: "90days", label: "90 Days" },
              { value: "12months", label: "12 Months" },
            ]}
            onPeriodChange={(period) => setSelectedPeriod(period as TimePeriod)}
          />
        </CardHeader>
        <CardBody>
          <Text color="textMuted">
            No site visitation data available for selected period
          </Text>
        </CardBody>
      </Card>
    );
  }

  const topSites = periodVisitation.slice(0, 5);
  const totalVisits = periodVisitation.reduce(
    (sum, site) => sum + site.visitCount,
    0
  );
  const uniqueSites = periodVisitation.length;

  // Categorize sites by visitation frequency
  const frequentSites = periodVisitation.filter((s) => s.percentage >= 15);
  const moderateSites = periodVisitation.filter(
    (s) => s.percentage >= 5 && s.percentage < 15
  );
  const rareSites = periodVisitation.filter((s) => s.percentage < 5);

  return (
    <Card>
      <CardHeader>
        <ChartHeader
          title="Site Visitation Patterns"
          description="Most and least visited dive sites"
          selectedPeriod={selectedPeriod}
          periods={[
            { value: "30days", label: "30 Days" },
            { value: "90days", label: "90 Days" },
            { value: "12months", label: "12 Months" },
          ]}
          onPeriodChange={(period) => setSelectedPeriod(period as TimePeriod)}
        />
      </CardHeader>
      <CardBody>
        {/* Quick Stats */}
        <HStack spacing={6} mb={6} flexWrap="wrap">
          <Stat>
            <StatLabel fontSize="xs" color="gray.600">
              Unique Sites
            </StatLabel>
            <StatNumber fontSize="lg">{uniqueSites}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel fontSize="xs" color="gray.600">
              Total Visits
            </StatLabel>
            <StatNumber fontSize="lg">{totalVisits}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel fontSize="xs" color="gray.600">
              Top Site
            </StatLabel>
            <StatNumber fontSize="lg">
              {topSites[0]?.percentage.toFixed(1)}%
            </StatNumber>
          </Stat>
        </HStack>

        {/* Site Distribution Categories */}
        <HStack spacing={4} mb={6} flexWrap="wrap">
          <Badge colorScheme="red" variant="solid">
            Frequent (&gt;=15%)
          </Badge>
          <Badge colorScheme="yellow" variant="solid">
            Moderate (5-15%)
          </Badge>
          <Badge colorScheme="green" variant="solid">
            Rare (&lt;5%)
          </Badge>
        </HStack>

        {/* Top Sites List */}
        <VStack spacing={3} align="stretch">
          <Text fontSize="sm" fontWeight="medium">
            Top Visited Sites
          </Text>

          {topSites.map((siteData, index) => {
            const isFrequent = siteData.percentage >= 15;
            const isModerate =
              siteData.percentage >= 5 && siteData.percentage < 15;
            const isRare = siteData.percentage < 5;

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
                      isFrequent ? "red" : isModerate ? "yellow" : "green"
                    }
                    w="full"
                    rounded="md"
                  />
                  <Text
                    fontSize="xs"
                    color="gray.500"
                    minW="80px"
                    textAlign="right"
                  >
                    Last: {formatDiveDate(siteData.lastVisited)}
                  </Text>
                </HStack>

                {siteData.site.region && (
                  <Text fontSize="xs" color="gray.600" mt={1}>
                    Region: {siteData.site.region}
                    {siteData.site.habitatType &&
                      ` • ${siteData.site.habitatType}`}
                  </Text>
                )}
              </Box>
            );
          })}
        </VStack>
      </CardBody>
    </Card>
  );
}
