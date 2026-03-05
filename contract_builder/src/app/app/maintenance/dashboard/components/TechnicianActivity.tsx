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
} from "@chakra-ui/react";
import type { TechnicianActivity } from "@/app/app/maintenance/_types";
import { useMemo, useState } from "react";

export default function TechnicianActivity({
  activities,
  onSelectTechnician,
}: {
  activities: TechnicianActivity[];
  onSelectTechnician: (technicianId: string) => void;
}) {
  const [sortDesc, setSortDesc] = useState(true);

  // Color values now come from semantic tokens in theme

  // Sort activities by count
  const sortedActivities = useMemo(() => {
    return [...activities].sort((a, b) => (sortDesc ? b.count - a.count : a.count - b.count));
  }, [activities, sortDesc]);

  return (
    <Box overflow="auto" pl={{ base: 0, lg: 2 }} maxH="calc(100vh - 320px)">
      <Heading size="sm" mb={3}>
        Technician Activity
      </Heading>
      <Table size="sm" variant="simple">
        <Thead
          position="sticky"
          top={0}
          bg="tableHeader"
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
          {sortedActivities.length === 0 ? (
            <Tr>
              <Td colSpan={2} textAlign="center" py={4} color="gray.500">
                No technician activity found.
              </Td>
            </Tr>
          ) : (
            sortedActivities.map((activity) => (
              <Tr
                key={activity.technician.id}
                // Remove all clickability and hover effects
                transition="none"
              >
                <Td>
                  <Tooltip
                    label={`${activity.technician.name} — ${activity.count} log${
                      activity.count === 1 ? "" : "s"
                    }`}
                    bg="tooltipBg"
                    color="tooltipText"
                    hasArrow
                  >
                    <Box as="span">{activity.technician.name}</Box>
                  </Tooltip>
                </Td>
                <Td>{activity.count}</Td>
              </Tr>
            ))
          )}
        </Tbody>
      </Table>
    </Box>
  );
}
