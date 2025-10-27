"use client";

import { useMemo } from "react";
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tag,
  useColorModeValue,
} from "@chakra-ui/react";
import type { Asset, AssetCategory } from "@/types/maintenance";
import {
  getTrackingLabel,
  getCurrentReading,
  getNextDueDisplay,
  getAssetStatus,
  getStatusColor,
} from "@/utils/maintenanceSelectors";

export interface CategoryPanelsProps {
  assets: Asset[];
  onViewLogs: (asset: Asset) => void;
  canEdit?: boolean; // kept for compatibility; actions are handled elsewhere
  onEditAsset?: (asset: Asset) => void;
}

const CATEGORY_ORDER: Record<AssetCategory, number> = {
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
  const thBg = useColorModeValue("gray.50", "gray.800");
  const rowHoverBg = useColorModeValue("gray.50", "gray.700");

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
    Object.keys(map).forEach((k) => map[k].sort((a, b) => a.name.localeCompare(b.name)));
    return map;
  }, [assets]);

  // Roots sorted by category, then name
  const sortedRoots = useMemo(() => {
    const roots = grouped["root"] || [];
    return [...roots].sort((a, b) => {
      const ca = CATEGORY_ORDER[a.category];
      const cb = CATEGORY_ORDER[b.category];
      if (ca !== cb) return ca - cb;
      return a.name.localeCompare(b.name);
    });
  }, [grouped]);

  return (
    <Box>
      <Table size="sm" variant="simple">
        <Thead>
          <Tr>
            <Th position="sticky" top={0} bg={thBg}>
              Name
            </Th>
            <Th position="sticky" top={0} bg={thBg}>
              Category
            </Th>
            <Th position="sticky" top={0} bg={thBg}>
              Tracking
            </Th>
            <Th position="sticky" top={0} bg={thBg}>
              Current
            </Th>
            <Th position="sticky" top={0} bg={thBg}>
              Next Due
            </Th>
            <Th position="sticky" top={0} bg={thBg}>
              Status
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
              rowHoverBg={rowHoverBg}
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
  rowHoverBg,
}: {
  asset: Asset;
  grouped: Record<string, Asset[]>;
  onViewLogs: (asset: Asset) => void;
  level: number;
  inheritedCategory?: AssetCategory;
  rowHoverBg: string;
}) {
  const displayCategory = inheritedCategory ?? asset.category;
  const status = getAssetStatus(asset);

  return (
    <>
      <Tr
        cursor="pointer"
        onClick={() => onViewLogs(asset)}
        _hover={{ bg: rowHoverBg }}
      >
        <Td style={{ paddingLeft: `${level * 20}px` }}>
          {level > 0 && "↳ "}
          {asset.name}
        </Td>
        <Td>{displayCategory}</Td>
        <Td>{getTrackingLabel(asset)}</Td>
        <Td>{getCurrentReading(asset) ?? "-"}</Td>
        <Td>{getNextDueDisplay(asset)}</Td>
        <Td>
          <Tag colorScheme={getStatusColor(status)}>{status}</Tag>
        </Td>
      </Tr>

      {(grouped[asset.id] || []).map((child) => (
        <AssetRow
          key={child.id}
          asset={child}
          grouped={grouped}
          onViewLogs={onViewLogs}
          level={level + 1}
          inheritedCategory={displayCategory}
          rowHoverBg={rowHoverBg}
        />
      ))}
    </>
  );
}