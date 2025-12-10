"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Heading,
  Spinner,
  VStack,
  HStack,
  Text,
  useBreakpointValue,
  Button,
} from "@chakra-ui/react";
import { getDiveDashboardData } from "@/services/diveDashboard";
import type { DiveDashboardData } from "@/types/dashboard";
import ProtectedRoute from "@/components/shared/LayoutComponents/ProtectedRoute";
import SummaryCards from "@/app/dives/dashboard/components/SummaryCards";
import SiteMatrix from "@/app/dives/dashboard/components/SiteMatrix";
import TemperatureChart from "@/app/dives/dashboard/components/TemperatureChart";
import SiteVisitationChart from "@/app/dives/dashboard/components/SiteVisitationChart";
import SeasonalWildlifePatterns from "@/app/dives/dashboard/components/SeasonalWildlifePatterns";

export default function DiveDashboardPage() {
  const [dashboardData, setDashboardData] = useState<DiveDashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState<
    "allTime" | "last30days" | "currentYear"
  >("allTime");
  const router = useRouter();

  const isMobile = useBreakpointValue({ base: true, xl: false });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const data = await getDiveDashboardData();
        setDashboardData(data);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <Box
        p={6}
        display="flex"
        justifyContent="center"
        alignItems="center"
        minH="400px"
      >
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error || !dashboardData) {
    return (
      <Box p={6}>
        <Text color="error">{error || "No data available"}</Text>
      </Box>
    );
  }

  return (
    <ProtectedRoute module="diveLog" permission="view">
      <Box p={6} maxW="full">
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Box>
            <HStack justify="space-between" align="start" mb={4}>
              <Box>
                <Heading size="lg" mb={2}>
                  Dive Log Dashboard
                </Heading>
                <Text color="textMuted">
                  Overview of dive activities, site utilization, and other
                  patterns
                </Text>
              </Box>
              <HStack spacing={3}>
                <Button
                  colorScheme="green"
                  onClick={() => router.push("/dives/view")}
                >
                  View Dives
                </Button>
                <Button
                  colorScheme="blue"
                  onClick={() => router.push("/dives/log")}
                >
                  Log Dive
                </Button>
              </HStack>
            </HStack>
          </Box>

          {/* Summary Statistics */}
          <SummaryCards
            stats={dashboardData.stats}
            statsLast30Days={dashboardData.statsLast30Days}
            statsCurrentYear={dashboardData.statsCurrentYear}
            onPeriodChange={setCurrentPeriod}
            currentPeriod={currentPeriod}
          />

          {/* Main Content Grid */}
          <Box
            display="grid"
            gridTemplateColumns={isMobile ? "1fr" : "1fr 1fr"}
            gap={6}
          >
            {/* 7-Day Site Matrix */}
            <Box gridColumn={isMobile ? "1" : "1 / -1"}>
              <SiteMatrix siteMatrix={dashboardData.siteMatrix} />
            </Box>

            {/* Temperature Trends */}
            <TemperatureChart trends={dashboardData.temperatureTrends} />

            {/* Site Visitation */}
            <SiteVisitationChart visitation={dashboardData.siteVisitation} />
          </Box>

          {/* Seasonal Wildlife Patterns */}
          <SeasonalWildlifePatterns patterns={dashboardData.seasonalPatterns} />
        </VStack>
      </Box>
    </ProtectedRoute>
  );
}
