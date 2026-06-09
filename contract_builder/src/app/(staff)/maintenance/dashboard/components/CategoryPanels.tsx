"use client";

import { useMemo, useState } from "react";
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tag,
  Button,
  HStack,
} from "@chakra-ui/react";
import { naturalSort } from "../hooks/useMaintenanceSearch";
import type { Asset, AssetCategory } from "@/app/(staff)/maintenance/_types";
import {
  getTrackingLabel,
  getCurrentReading,
  getNextDueDisplay,
  getAssetStatus,
  getStatusColor,
} from "@/app/(staff)/maintenance/_lib/maintenanceSelectors";
import { formatDate } from "@shared/utils/formatters";

export interface CategoryPanelsProps {
  assets: Asset[];
  onViewLogs: (asset: Asset) => void;
  canEdit?: boolean; // kept for compatibility; actions are handled elsewhere
  onEditAsset?: (asset: Asset) => void;
}

const CATEGORY_ORDER: Record<string, number> = {
  Marine: 0,
  Compressors: 1,
  Vehicles: 2,
  "Scuba Equipment": 3,
  Other: 4,
};

export default function CategoryPanels({
  assets,
  onViewLogs,
}: CategoryPanelsProps) {
  const [collapsedParents, setCollapsedParents] = useState<Set<string>>(new Set());

  const toggleParentCollapse = (parentId: string) => {
    setCollapsedParents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(parentId)) {
        newSet.delete(parentId);
      } else {
        newSet.add(parentId);
      }
      return newSet;
    });
  };

  // Group by parentAssetId for hierarchy
  const grouped = useMemo(() => {
    const map: Record<string, Asset[]> = {};
    // Put every asset under its parent key (or 'root' when no parent)
    for (const a of assets) {
      const key = a.parentAssetId ?? "root";
      if (!map[key]) map[key] = [];
      map[key].push(a);
    }
    // Sort siblings by name for stable display
    Object.keys(map).forEach((k) => map[k].sort((a, b) => naturalSort(a.name, b.name)));
    return map;
  }, [assets]);

  // Roots sorted by category, then name
  const sortedRoots = useMemo(() => {
    const roots = grouped["root"] || [];
    return [...roots].sort((a, b) => {
      const ca = CATEGORY_ORDER[a.category];
      const cb = CATEGORY_ORDER[b.category];
      if (ca !== cb) return ca - cb;
      return naturalSort(a.name, b.name);
    });
  }, [grouped]);

  return (
    <Box>
      <Table size="sm" variant="simple">
        <Thead>
          <Tr>
            <Th position="sticky" top={0} bg="tableHeader">
              Name
            </Th>
            <Th position="sticky" top={0} bg="tableHeader">
              Category
            </Th>
            <Th position="sticky" top={0} bg="tableHeader">
              Tracking
            </Th>
            <Th position="sticky" top={0} bg="tableHeader">
              Current
            </Th>
            <Th position="sticky" top={0} bg="tableHeader">
              Next Due
            </Th>
            <Th position="sticky" top={0} bg="tableHeader">
              Status
            </Th>
            <Th position="sticky" top={0} bg="tableHeader">
              Last Updated
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {sortedRoots.map((asset) => (
            <AssetRow
              key={asset.id}
              asset={asset}
              grouped={grouped}
              onViewLogs={onViewLogs}
              level={0}
              inheritedCategory={undefined}
              collapsedParents={collapsedParents}
              onToggleCollapse={toggleParentCollapse}
            />
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}

function AssetRow({
  asset,
  grouped,
  onViewLogs,
  level,
  inheritedCategory,
  collapsedParents,
  onToggleCollapse,
}: {
  asset: Asset;
  grouped: Record<string, Asset[]>;
  onViewLogs: (asset: Asset) => void;
  level: number;
  inheritedCategory?: AssetCategory;
  collapsedParents: Set<string>;
  onToggleCollapse: (parentId: string) => void;
}) {
  const displayCategory = inheritedCategory ?? asset.category;
  const status = getAssetStatus(asset);
  const hasChildren = grouped[asset.id]?.length > 0;
  const isCollapsed = collapsedParents.has(asset.id);

  return (
    <>
      <Tr
        cursor="pointer"
        onClick={() => onViewLogs(asset)}
        _hover={{ bg: "bgHover" }}
      >
        <Td style={{ paddingLeft: `${level * 20}px` }}>
          <Box display="flex" alignItems="center" gap={1}>
            {hasChildren && (
              <Button
                size="xs"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCollapse(asset.id);
                }}
                p={1}
                minW={4}
                h={4}
              >
                {isCollapsed ? "▶" : "▼"}
              </Button>
            )}
            {!hasChildren && level > 0 && <span style={{ marginRight: "4px" }}>↳</span>}
            <span>{asset.name}</span>
          </Box>
        </Td>
        <Td>{displayCategory}</Td>
        <Td>{getTrackingLabel(asset)}</Td>
        <Td>{getCurrentReading(asset) ?? "-"}</Td>
        <Td>{getNextDueDisplay(asset)}</Td>
        <Td>
          <Tag colorScheme={getStatusColor(status)}>{status}</Tag>
        </Td>
        <Td>
          {(asset.updatedAt || asset.lastServiceDate)
            ? formatDate((asset.updatedAt || asset.lastServiceDate) as any)
            : "-"}
        </Td>
      </Tr>

      {!isCollapsed && (grouped[asset.id] || []).map((child) => (
        <AssetRow
          key={child.id}
          asset={child}
          grouped={grouped}
          onViewLogs={onViewLogs}
          level={level + 1}
          inheritedCategory={displayCategory}
          collapsedParents={collapsedParents}
          onToggleCollapse={onToggleCollapse}
        />
      ))}
    </>
  );
}