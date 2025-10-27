"use client";

import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tooltip,
  useColorModeValue,
} from "@chakra-ui/react";
import type { Technician, MaintenanceLog } from "@/types/maintenance";
import { useMemo, useState } from "react";

export default function TechnicianActivity({
  technicians,
  logs,
  onSelectTechnician,
}: {
  technicians: Technician[];
  logs: MaintenanceLog[];
  onSelectTechnician: (technicianId: string) => void;
}) {
  const [sortDesc, setSortDesc] = useState(true);

  const rowHoverBg = useColorModeValue("gray.50", "gray.700");
  const tooltipBg = useColorModeValue("white", "gray.700");
  const tooltipColor = useColorModeValue("gray.800", "white");
  const headerBg = useColorModeValue("gray.100", "gray.900");

  // Automatically restrict logs to last 30 days
  const recentLogs = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return logs.filter((l) => new Date(l.date) >= cutoff);
  }, [logs]);

  // Compute activity counts per technician
  const rows = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of recentLogs) {
      if (!l.technicianId) continue;
      counts.set(l.technicianId, (counts.get(l.technicianId) ?? 0) + 1);
    }
    return technicians
      .map((t) => ({
        ...t,
        count: counts.get(t.id) ?? 0,
      }))
      .sort((a, b) => (sortDesc ? b.count - a.count : a.count - b.count));
  }, [technicians, recentLogs, sortDesc]);

  return (
    <Box overflow="auto" pl={{ base: 0, lg: 2 }} maxH="calc(100vh - 320px)">
      <Heading size="sm" mb={3}>
        Technicians (last 30 days)
      </Heading>
      <Table size="sm" variant="simple">
        <Thead
          position="sticky"
          top={0}
          bg={headerBg}
          zIndex={1}
          boxShadow="sm"
        >
          <Tr>
            <Th>Name</Th>
            <Th
              cursor="pointer"
              onClick={() => setSortDesc((v) => !v)}
              title="Toggle sort"
            >
              Activity
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {rows.length === 0 ? (
            <Tr>
              <Td colSpan={2} textAlign="center" py={4} color="gray.500">
                No technician activity in the past 30 days.
              </Td>
            </Tr>
          ) : (
            rows.map((t) => (
              <Tr
                key={t.id}
                cursor="pointer"
                _hover={{
                  bg: rowHoverBg,
                  transform: "scale(1.01)",
                }}
                transition="all 0.1s ease-in-out"
                onClick={() => onSelectTechnician(t.id)}
              >
                <Td>
                  <Tooltip
                    label={`${t.name} — ${t.count} log${
                      t.count === 1 ? "" : "s"
                    }`}
                    bg={tooltipBg}
                    color={tooltipColor}
                    hasArrow
                  >
                    <Box as="span">{t.name}</Box>
                  </Tooltip>
                </Td>
                <Td>{t.count}</Td>
              </Tr>
            ))
          )}
        </Tbody>
      </Table>
    </Box>
  );
}
