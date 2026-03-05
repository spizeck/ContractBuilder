"use client";

import {
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Box
} from "@chakra-ui/react";
import type { DashboardFilterResult, DashboardFilter } from "@/app/(staff)/maintenance/_types";

export interface SummaryCardsProps {
  summary: DashboardFilterResult["stats"];
  onFilterSelect: (type: "all" | "overdue" | "dueSoon" | "recentLogs") => void;
  activeCardFilter: DashboardFilter["cardFilter"];
}

export default function SummaryCards({
  summary,
  onFilterSelect,
  activeCardFilter,
}: SummaryCardsProps) {
  return (
    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} p={3}>
      <Card
        color="green.500"
        label="Total Assets"
        value={summary.totalAssets}
        isClickable={false}
      />
      <Card
        color="green.600"
        label="Total Logs"
        value={summary.logsThisMonth}
        isClickable={false}
      />
      <Card
        color="red.500"
        label="Overdue Services"
        value={summary.overdueServices}
        isClickable={false}
      />
      <Card
        color="orange.500"
        label="Upcoming Services"
        value={summary.upcomingServices}
        isClickable={false}
      />
    </SimpleGrid>
  );
}

function Card(props: {
  color: string;
  label: string;
  value: number;
  isClickable: boolean;
}) {
  return (
    <Box
      borderWidth="1px"
      borderRadius="md"
      p={3}
      cursor={props.isClickable ? "pointer" : "default"}
    >
      <Stat>
        <StatLabel>{props.label}</StatLabel>
        <StatNumber color={props.color}>{props.value}</StatNumber>
      </Stat>
    </Box>
  );
}
