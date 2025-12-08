"use client";

import { Button, ButtonGroup, Heading, Text, VStack, useBreakpointValue } from "@chakra-ui/react";

interface ChartHeaderProps {
  title: string;
  description: string;
  selectedPeriod: string;
  periods: Array<{ value: string; label: string; color?: string }>;
  onPeriodChange: (period: string) => void;
}

export default function ChartHeader({
  title,
  description,
  selectedPeriod,
  periods,
  onPeriodChange,
}: ChartHeaderProps) {
  const isMobile = useBreakpointValue({ base: true, xl: false });

  return (
    <VStack
      spacing={3}
      align={isMobile ? "stretch" : "center"}
      flexDir={isMobile ? "column" : "row"}
    >
      <Heading size="md">{title}</Heading>
      <ButtonGroup
        size="sm"
        isAttached
        variant="outline"
        width={isMobile ? "full" : "auto"}
      >
        {periods.map((period) => (
          <Button
            key={period.value}
            onClick={() => onPeriodChange(period.value)}
            bg={selectedPeriod === period.value ? (period.color || "infoLink") : undefined}
            color={selectedPeriod === period.value ? "white" : undefined}
            _hover={{
              bg: selectedPeriod === period.value
                ? period.color
                  ? `${period.color}.700`
                  : "infoLink"
                : undefined,
            }}
            flex={1}
          >
            {period.label}
          </Button>
        ))}
      </ButtonGroup>
      <Text fontSize="sm" color="textMuted">
        {description}
      </Text>
    </VStack>
  );
}
