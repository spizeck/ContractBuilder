"use client";

import { Box, HStack, Input, Select, Flex } from "@chakra-ui/react";
import type { Technician } from "@/types/maintenance";
import { useMemo } from "react";
import { IconButton } from "@chakra-ui/react";
import { DeleteIcon } from "@chakra-ui/icons";

const CATEGORIES = [
  "All",
  "Marine",
  "Compressors",
  "Vehicles",
  "Scuba Equipment",
  "Other",
] as const;

export interface DashboardHeaderProps {
  keyword: string;
  onKeyword: (v: string) => void;
  category: (typeof CATEGORIES)[number];
  onCategory: (v: (typeof CATEGORIES)[number]) => void;
  technicianId: string | "All";
  onTechnician: (v: string | "All") => void;
  range: { start: Date | null; end: Date | null };
  onRange: (r: { start: Date | null; end: Date | null }) => void;
  technicians?: Technician[]; // make optional
}

export default function DashboardHeader(props: DashboardHeaderProps) {
  const techOptions = useMemo(
    () => {
      const technicians = props.technicians ?? []; // guard undefined
      return [{ id: "All", name: "All Technicians" } as any].concat(
        technicians.map((t) => ({ id: t.id, name: t.name }))
      );
    },
    [props.technicians]
  );

  // Ensure the dashboard header does not obscure global navbar dropdowns.
  // Set a low zIndex here so portal-based dropdowns (which typically use high z-indices)
  // render above this header. If a navbar dropdown still appears behind the header,
  // increase the dropdown zIndex or ensure it renders in a Portal.
  return (
    <Box position="sticky" top={0} borderBottomWidth="1px" zIndex={0} p={3}>
      <Flex
        gap={3}
        direction={{ base: "column", md: "row" }}
        align={{ base: "stretch", md: "center" }}
      >
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
            {CATEGORIES.map((c: string) => (
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
        {props.range && (
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
            <IconButton
              aria-label="Clear dates"
              variant="outline"
              size="sm"
              icon={<DeleteIcon />}
              onClick={() => props.onRange({ start: null, end: null })}
            />
          </HStack>
        )}
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
