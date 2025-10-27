"use client";

import {
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Box,
  useColorModeValue,
} from "@chakra-ui/react";
import type { Summary } from "../hooks/useMaintenanceSummary";

export interface SummaryCardsProps {
  summary: Summary;
  onFilterSelect: (type: "all" | "overdue" | "dueSoon" | "recentLogs") => void;
}

export default function SummaryCards({
  summary,
  onFilterSelect,
}: SummaryCardsProps) {
  return (
    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} p={3}>
      <Card
        color="green.500"
        label="Total Assets"
        value={summary.totalAssets}
        onClick={() => onFilterSelect("all")}
      />
      <Card
        color="green.600"
        label="Logs This Month"
        value={summary.logsThisMonth}
        onClick={() => onFilterSelect("recentLogs")}
      />
      <Card
        color="red.500"
        label="Overdue Services"
        value={summary.overdue}
        onClick={() => onFilterSelect("overdue")}
      />
      <Card
        color="orange.500"
        label="Upcoming Services"
        value={summary.dueSoon}
        onClick={() => onFilterSelect("dueSoon")}
      />
    </SimpleGrid>
  );
}

function Card(props: {
  color: string;
  label: string;
  value: number;
  onClick: () => void;
}) {
  const hoverBg = useColorModeValue("gray.50", "gray.700");
  return (
    <Box
      borderWidth="1px"
      borderRadius="md"
      p={3}
      cursor="pointer"
      onClick={props.onClick}
      _hover={{ bg: hoverBg }}
      transition={"background-color 0.2s ease"}
    >
      <Stat>
        <StatLabel>{props.label}</StatLabel>
        <StatNumber color={props.color}>{props.value}</StatNumber>
      </Stat>
    </Box>
  );
}
