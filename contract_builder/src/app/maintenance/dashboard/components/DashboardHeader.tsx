"use client";

import { Box, HStack, Input, Select, Button, Flex } from "@chakra-ui/react";
import type { Technician } from "@/types/maintenance";
import { useMemo } from "react";

const categories = ["All", "Marine", "Compressors", "Vehicles", "Scuba Equipment", "Other"] as const;

export interface DashboardHeaderProps {
  keyword: string;
  onKeyword: (v: string) => void;
  category: (typeof categories)[number];
  onCategory: (v: (typeof categories)[number]) => void;
  technicianId: string | "All";
  onTechnician: (v: string | "All") => void;
  range: { start: Date | null; end: Date | null };
  onRange: (r: { start: Date | null; end: Date | null }) => void;
  technicians: Technician[];
}

export default function DashboardHeader(props: DashboardHeaderProps) {
  const techOptions = useMemo(
    () =>
      [{ id: "All", name: "All Technicians" } as any].concat(
        props.technicians.map((t) => ({ id: t.id, name: t.name }))
      ),
    [props.technicians]
  );

  return (
    <Box position="sticky" top={0} bg="white" zIndex={1} borderBottomWidth="1px" p={3}>
      <Flex gap={3} direction={{ base: "column", md: "row" }} align={{ base: "stretch", md: "center" }}>
        <Input
          placeholder="Search assets, summaries, details, technicians..."
          value={props.keyword}
          onChange={(e) => props.onKeyword(e.target.value)}
          flex={2}
        />
        <HStack spacing={3} flex={1}>
          <Select
            value={props.category}
            onChange={(e) => props.onCategory(e.target.value as any)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Select
            value={props.technicianId}
            onChange={(e) => props.onTechnician(e.target.value as any)}
          >
            {techOptions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </HStack>

        <HStack spacing={2}>
          <Input
            type="date"
            value={props.range.start ? toInputDate(props.range.start) : ""}
            onChange={(e) =>
              props.onRange({
                start: e.target.value ? new Date(e.target.value) : null,
                end: props.range.end,
              })
            }
          />
          <Input
            type="date"
            value={props.range.end ? toInputDate(props.range.end) : ""}
            onChange={(e) =>
              props.onRange({
                start: props.range.start,
                end: e.target.value ? new Date(e.target.value) : null,
              })
            }
          />
          <Button
            variant="outline"
            onClick={() =>
              props.onRange({ start: null, end: null })
            }
          >
            Clear dates
          </Button>
        </HStack>
      </Flex>
    </Box>
  );
}

function toInputDate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}