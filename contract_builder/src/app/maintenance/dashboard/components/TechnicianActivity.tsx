"use client";

import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Heading,
  Badge,
} from "@chakra-ui/react";
import type { Technician, MaintenanceLog } from "@/types/maintenance";
import { useMemo, useState } from "react";

export default function TechnicianActivity({
  technicians,
  logs,
  onSelectTechnician,
}: {
  technicians: Technician[];
  logs: MaintenanceLog[]; // expected: last 30 days subset
  onSelectTechnician: (technicianId: string) => void;
}) {
  const [sortDesc, setSortDesc] = useState(true);

  const rows = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of logs) {
      counts.set(l.technicianId, (counts.get(l.technicianId) ?? 0) + 1);
    }
    return technicians
      .map((t) => ({
        ...t,
        count: counts.get(t.id) ?? 0,
        active: !!t.active,
      }))
      .sort((a, b) => (sortDesc ? b.count - a.count : a.count - b.count));
  }, [technicians, logs, sortDesc]);

  return (
    <Box>
      <Heading size="sm" mb={2}>
        Technician Activity (30 days)
      </Heading>
      <Table size="sm" variant="simple">
        <Thead>
          <Tr>
            <Th>Technician</Th>
            <Th isNumeric cursor="pointer" onClick={() => setSortDesc((s) => !s)}>
              Logs {sortDesc ? "▼" : "▲"}
            </Th>
            <Th>Active</Th>
            <Th>Certifications</Th>
          </Tr>
        </Thead>
        <Tbody>
          {rows.map((t) => (
            <Tr key={t.id} _hover={{ bg: "gray.50" }} cursor="pointer" onClick={() => onSelectTechnician(t.id)}>
              <Td>{t.name}</Td>
              <Td isNumeric>{t.count}</Td>
              <Td>
                <Badge colorScheme={t.active ? "green" : "gray"}>{t.active ? "Yes" : "No"}</Badge>
              </Td>
              <Td>{t.certifications ?? "-"}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}