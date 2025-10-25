"use client";

import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionIcon,
  AccordionPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  HStack,
  Button,
  Text,
  Box,
  Stack,
} from "@chakra-ui/react";
import type { Asset } from "@/types/maintenance";
import { computeAssetStatus } from "../hooks/useAssetStatus";
import { useState, useMemo } from "react";

export interface CategoryPanelsProps {
  assets: Asset[];
  onViewLogs: (asset: Asset) => void;
  canEdit: boolean;
  onEditAsset?: (asset: Asset) => void;
}

const CATEGORY_ORDER: Asset["category"][] = ["Marine", "Compressors", "Vehicles", "Scuba Equipment", "Other"];

export default function CategoryPanels({ assets, onViewLogs, canEdit, onEditAsset }: CategoryPanelsProps) {
  const treesByCategory = useMemo(() => buildTreesByCategory(assets), [assets]);

  return (
    <Accordion allowMultiple defaultIndex={[0]} reduceMotion>
      {CATEGORY_ORDER.map((cat) => {
        const trees = treesByCategory[cat] ?? [];
        return (
          <AccordionItem key={cat}>
            <h2>
              <AccordionButton>
                <Box as="span" flex="1" textAlign="left">
                  {cat} ({trees.reduce((acc, t) => acc + 1 + t.children.length, 0)})
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel>
              {trees.length === 0 ? (
                <Text color="gray.500">No assets in this category.</Text>
              ) : (
                <PaginatedAssetTable
                  trees={trees}
                  onViewLogs={onViewLogs}
                  canEdit={canEdit}
                  onEditAsset={onEditAsset}
                />
              )}
            </AccordionPanel>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}

type TreeNode = { parent: Asset; children: Asset[] };

function PaginatedAssetTable({
  trees,
  onViewLogs,
  canEdit,
  onEditAsset,
}: {
  trees: TreeNode[];
  onViewLogs: (asset: Asset) => void;
  canEdit: boolean;
  onEditAsset?: (asset: Asset) => void;
}) {
  const pageSize = 20;

  // Flatten rows (parents followed by their children)
  const flatRows = useMemo(() => {
    const rows: Array<{ kind: "parent" | "child"; asset: Asset; parentId?: string }> = [];
    for (const t of trees) {
      rows.push({ kind: "parent", asset: t.parent });
      for (const c of t.children) {
        rows.push({ kind: "child", asset: c, parentId: t.parent.id });
      }
    }
    return rows;
  }, [trees]);

  const [page, setPage] = useState(0);
  const start = page * pageSize;
  const pageItems = flatRows.slice(start, start + pageSize);
  const totalPages = Math.ceil(flatRows.length / pageSize);

  return (
    <Box>
      <Table size="sm" variant="simple">
        <Thead>
          <Tr>
            <Th>Asset</Th>
            <Th isNumeric>Hours</Th>
            <Th isNumeric>Next Service</Th>
            <Th>Last Service</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {pageItems.map((row) => {
            const isParent = row.kind === "parent";
            const status = isParent
              ? aggregateStatus(row.asset, trees.find(t => t.parent.id === row.asset.id)?.children ?? [])
              : computeAssetStatus(row.asset);

            return (
              <Tr key={`${row.kind}-${row.asset.id}`}>
                <Td>
                  <Box pl={isParent ? 0 : 6}>
                    {!isParent && <Box as="span" mr={2}>↳</Box>}
                    {row.asset.name}
                  </Box>
                </Td>
                <Td isNumeric>{row.asset.hours ?? "-"}</Td>
                <Td isNumeric>{row.asset.nextServiceDue ?? "-"}</Td>
                <Td>{row.asset.lastServiceDate ? formatDate(row.asset.lastServiceDate) : "-"}</Td>
                <Td>
                  <Badge colorScheme={status.colorScheme}>{status.status}</Badge>
                </Td>
                <Td>
                  <Stack direction={{ base: "column", md: "row" }} spacing={2}>
                    <Button size="xs" onClick={() => onViewLogs(row.asset)} flex={1} minW={0}>
                      View Logs
                    </Button>
                    {canEdit && (
                      <Button size="xs" variant="outline" onClick={() => onEditAsset?.(row.asset)} flex={1} minW={0}>
                        Edit
                      </Button>
                    )}
                  </Stack>
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>

      {totalPages > 1 && (
        <HStack mt={3} justify="flex-end" spacing={2}>
          <Button size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} isDisabled={page === 0}>
            Prev
          </Button>
          <Text fontSize="sm">
            Page {page + 1} of {totalPages}
          </Text>
          <Button
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            isDisabled={page >= totalPages - 1}
          >
            Next
          </Button>
        </HStack>
      )}
    </Box>
  );
}

function buildTreesByCategory(assets: Asset[]) {
  const byId = new Map(assets.map(a => [a.id, a]));
  const childrenByParent = new Map<string, Asset[]>();
  for (const a of assets) {
    if (a.parentAssetId) {
      const arr = childrenByParent.get(a.parentAssetId) || [];
      arr.push(a);
      childrenByParent.set(a.parentAssetId, arr);
    }
  }

  const parents = assets.filter(a => !a.parentAssetId);
  const grouped: Record<Asset["category"], TreeNode[]> = {
    Marine: [],
    Compressors: [],
    Vehicles: [],
    "Scuba Equipment": [],
    Other: [],
  } as any;

  // Parents define the category; children inherit their parent's category for grouping
  for (const p of parents) {
    const cat = p.category;
    const kids = (childrenByParent.get(p.id) || []).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    grouped[cat].push({ parent: p, children: kids });
  }

  // Handle orphaned children whose parent isn't in the current asset list
  for (const a of assets) {
    if (a.parentAssetId && !byId.has(a.parentAssetId)) {
      const cat = a.category ?? "Other";
      grouped[cat as Asset["category"]]?.push({ parent: a, children: [] });
    }
  }

  // Sort parents by name within category
  for (const k of Object.keys(grouped) as Array<Asset["category"]>) {
    grouped[k] = grouped[k].sort((x, y) => (x.parent.name || "").localeCompare(y.parent.name || ""));
  }
  return grouped;
}

function aggregateStatus(parent: Asset, children: Asset[]) {
  const ranks: Record<ReturnType<typeof computeAssetStatus>["status"], number> = { Overdue: 2, "Due Soon": 1, OK: 0 };
  const all = [parent, ...children].map(a => computeAssetStatus(a));
  const worst = all.reduce((acc, s) => (ranks[s.status] > ranks[acc.status] ? s : acc), { status: "OK", colorScheme: "green" as const });
  return worst;
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "2-digit" }).format(d);
}