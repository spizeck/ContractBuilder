"use client";

import React, { useState, useEffect } from "react";
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
  Button,
  ButtonGroup,
  useBreakpointValue,
  Spinner,
} from "@chakra-ui/react";
import type { TemperatureTrend } from "@/app/(staff)/dive-log/_types";
import { formatDiveDate } from "@shared/utils/dateUtils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getTemperatureTrends } from "@/app/(staff)/dive-log/_lib/diveDashboardRepo";
import ChartHeader from "./ChartHeader";

interface TemperatureChartProps {
  trends: TemperatureTrend[];
}

type TimePeriod = "30days" | "12months" | "24months";

export default function TemperatureChart({ trends }: TemperatureChartProps) {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("30days");
  const [periodTrends, setPeriodTrends] = useState<TemperatureTrend[]>(trends);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchPeriodData = async () => {
      setLoading(true);
      try {
        const data = await getTemperatureTrends(selectedPeriod);
        setPeriodTrends(data);
      } catch (error) {
        console.error("Failed to fetch temperature trends:", error);
        // Fallback to client-side filtering if API fails
        const filtered = filterDataByPeriod(trends, selectedPeriod);
        setPeriodTrends(filtered);
      } finally {
        setLoading(false);
      }
    };

    fetchPeriodData();
  }, [selectedPeriod, trends]);

  const celsiusToFahrenheit = (celsius: number) => {
    return Math.round(((celsius * 9) / 5 + 32) * 10) / 10;
  };

  // Outlier detection using IQR method
  const removeOutliers = (data: TemperatureTrend[]): TemperatureTrend[] => {
    if (data.length < 5) return data; // Need minimum data points for outlier detection

    const temperatures = data.map((d) => d.temperature);
    const sorted = [...temperatures].sort((a, b) => a - b);

    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;

    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    return data.filter(
      (d) => d.temperature >= lowerBound && d.temperature <= upperBound
    );
  };

  // Apply smoothing using moving average
  const smoothData = (
    data: TemperatureTrend[],
    windowSize: number = 3
  ): TemperatureTrend[] => {
    if (data.length <= windowSize) return data;

    const smoothed: TemperatureTrend[] = [];

    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(data.length, i + Math.floor(windowSize / 2) + 1);
      const window = data.slice(start, end);

      const avgTemp =
        window.reduce((sum, d) => sum + d.temperature, 0) / window.length;
      const totalDives = window.reduce((sum, d) => sum + d.diveCount, 0);

      smoothed.push({
        ...data[i],
        temperature: Math.round(avgTemp * 10) / 10,
        diveCount: Math.round(totalDives / window.length),
      });
    }

    return smoothed;
  };

  const filterDataByPeriod = (data: TemperatureTrend[], period: TimePeriod) => {
    const now = new Date();
    let cutoffDate: Date;

    switch (period) {
      case "30days":
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "12months":
        cutoffDate = new Date(
          now.getFullYear() - 1,
          now.getMonth(),
          now.getDate()
        );
        break;
      case "24months":
        cutoffDate = new Date(
          now.getFullYear() - 2,
          now.getMonth(),
          now.getDate()
        );
        break;
      default:
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return data.filter((trend) => new Date(trend.date) >= cutoffDate);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <ChartHeader
            title="Temperature Trends"
            description="Water temperature patterns over time"
            selectedPeriod={selectedPeriod}
            periods={[
              { value: "30days", label: "30 Days", color: "warning" },
              { value: "12months", label: "12 Months", color: "warning" },
              { value: "24months", label: "24 Months", color: "warning" },
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
            <Spinner size="xl" color="warning" />
            <Text color="textMuted">Loading temperature data...</Text>
          </VStack>
        </CardBody>
      </Card>
    );
  }

  if (periodTrends.length === 0) {
    return (
      <Card>
        <CardHeader>
          <ChartHeader
            title="Temperature Trends"
            description="Water temperature patterns over time"
            selectedPeriod={selectedPeriod}
            periods={[
              { value: "30days", label: "30 Days", color: "warning" },
              { value: "12months", label: "12 Months", color: "warning" },
              { value: "24months", label: "24 Months", color: "warning" },
            ]}
            onPeriodChange={(period) => setSelectedPeriod(period as TimePeriod)}
          />
        </CardHeader>
        <CardBody>
          <Text color="textMuted">
            No temperature data available for selected period
          </Text>
        </CardBody>
      </Card>
    );
  }

  const sortedTrends = [...periodTrends].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Apply outlier removal and smoothing
  const cleanedTrends = removeOutliers(sortedTrends);
  const smoothedTrends = smoothData(cleanedTrends);

  // Calculate stats from cleaned data
  const latestTemp =
    smoothedTrends[smoothedTrends.length - 1]?.temperature || 0;
  const avgTemp =
    smoothedTrends.reduce((sum, trend) => sum + trend.temperature, 0) /
      smoothedTrends.length || 0;
  const maxTemp = Math.max(...smoothedTrends.map((t) => t.temperature));
  const minTemp = Math.min(...smoothedTrends.map((t) => t.temperature));

  // Prepare data for recharts
  const chartData = smoothedTrends.map((trend) => ({
    date: formatDiveDate(new Date(trend.date)),
    temperature: trend.temperature,
    fahrenheit: celsiusToFahrenheit(trend.temperature),
    diveCount: trend.diveCount,
  }));

  // Calculate Y-axis domain with padding
  const tempRange = maxTemp - minTemp;
  const yDomain = [
    Math.max(0, minTemp - tempRange * 0.1), // 10% padding below, but not below 0
    maxTemp + tempRange * 0.1, // 10% padding above
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          bg="white"
          p={2}
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
        >
          <Text fontSize="sm" fontWeight="medium">
            {payload[0].payload.date}
          </Text>
          <Text fontSize="sm" color="orange.600">
            {payload[0].value}°C / {payload[0].payload.fahrenheit}°F
          </Text>
          <Text fontSize="xs" color="gray.600">
            {payload[0].payload.diveCount} dives
          </Text>
        </Box>
      );
    }
    return null;
  };

  return (
    <Card minH="500px">
      <CardHeader>
        <ChartHeader
          title="Temperature Trends"
          description="Water temperature patterns over time"
          selectedPeriod={selectedPeriod}
          periods={[
            { value: "30days", label: "30 Days", color: "orange.500" },
            { value: "12months", label: "12 Months", color: "orange.500" },
            { value: "24months", label: "24 Months", color: "orange.500" },
          ]}
          onPeriodChange={(period) => setSelectedPeriod(period as TimePeriod)}
        />
      </CardHeader>
      <CardBody>
        {/* Temperature Stats */}
        <HStack spacing={6} mb={6} flexWrap="wrap">
          <Stat>
            <StatLabel fontSize="xs" color="gray.600">
              Current
            </StatLabel>
            <StatNumber fontSize="lg" color="orange.600">
              {latestTemp}°C / {celsiusToFahrenheit(latestTemp)}°F
            </StatNumber>
          </Stat>
          <Stat>
            <StatLabel fontSize="xs" color="gray.600">
              Average
            </StatLabel>
            <StatNumber fontSize="lg">
              {avgTemp.toFixed(1)}°C / {celsiusToFahrenheit(avgTemp)}°F
            </StatNumber>
          </Stat>
          <Stat>
            <StatLabel fontSize="xs" color="gray.600">
              Range
            </StatLabel>
            <StatNumber fontSize="lg">
              {minTemp.toFixed(1)}° - {maxTemp.toFixed(1)}°C
            </StatNumber>
            <Text fontSize="xs" color="gray.600" textAlign="center">
              {celsiusToFahrenheit(minTemp)}° - {celsiusToFahrenheit(maxTemp)}°F
            </Text>
          </Stat>
        </HStack>

        {/* Line Chart */}
        <Box h="300px" w="full" minW="0" position="relative" mb={8}>
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
              >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chakra-colors-border)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                yAxisId="celsius"
                tick={{ fontSize: 12 }}
                label={{
                  value: "Temperature (°C)",
                  angle: -90,
                  position: "insideLeft",
                  dy: 75,
                }}
                domain={yDomain}
                tickFormatter={(value) => Number(value).toFixed(1)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                yAxisId="celsius"
                type="monotone"
                dataKey="temperature"
                stroke="var(--chakra-colors-orange-500)"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
          ) : (
            <Box display="flex" justifyContent="center" alignItems="center" h="300px">
              <Spinner color="warning" />
            </Box>
          )}
        </Box>

        {/* Temperature Insights */}
        <Box mt={8} p={4} bg="temperatureInsights" borderRadius="md">
          <Text fontSize="sm" fontWeight="medium" color="textPrimary" mb={2}>
            Temperature Insights
          </Text>
          <VStack align="start" spacing={1}>
            <Text fontSize="xs" color="textSecondary">
              • Raw data points: {sortedTrends.length} temperature readings
            </Text>
            <Text fontSize="xs" color="textSecondary">
              • After cleaning: {smoothedTrends.length} data points displayed
            </Text>
            <Text fontSize="xs" color="textSecondary">
              • Temperature variance: {(maxTemp - minTemp).toFixed(1)}°C
            </Text>
            <Text fontSize="xs" color="textSecondary">
              • Trending:{" "}
              {avgTemp > latestTemp
                ? "Cooling "
                : avgTemp < latestTemp
                ? "Warming "
                : "Stable "}
              {Math.abs(avgTemp - latestTemp).toFixed(1)}°C from average
            </Text>
            {sortedTrends.length > smoothedTrends.length && (
              <Text fontSize="xs" color="textSecondary" fontStyle="italic">
                • Outliers removed:{" "}
                {sortedTrends.length - smoothedTrends.length} data points
                filtered
              </Text>
            )}
          </VStack>
        </Box>
      </CardBody>
    </Card>
  );
}
