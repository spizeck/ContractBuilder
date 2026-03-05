"use client";

import { useEffect, useMemo, useState } from "react";
import { naturalSort } from "../dashboard/hooks/useMaintenanceSearch";
import {
  Box,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Button,
  Select,
  HStack,
  Input,
} from "@chakra-ui/react";
import { getAssets, deleteAsset } from "@/app/(staff)/maintenance/_lib/assetsRepo";
import { Asset, AssetCategory } from "@/app/(staff)/maintenance/_types";
import AddEditAssetForm from "../components/AddEditAssetForm";
import BulkImportModal from "../components/BulkImportModal";
import {
  getTrackingLabel,
  getCurrentReading,
  getNextDueDisplay,
} from "@/app/(staff)/maintenance/_lib/maintenanceSelectors";

// Allowed categories going forward — use these for filters and parent assignment
const ALLOWED_CATEGORIES = [
  "Marine",
  "Compressors",
  "Vehicles",
  "Scuba Equipment",
  "Other",
] as const;

// Category sort order
const CATEGORY_ORDER: Record<AssetCategory, number> = {
  Marine: 0,
  Compressors: 1,
  Vehicles: 2,
  "Scuba Equipment": 3,
  Other: 4,
};

export default function AssetsPage() {
  // Color values now come from semantic tokens in theme
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [collapsedParents, setCollapsedParents] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAssets();
  }, []);

  async function loadAssets() {
    setLoading(true);
    try {
      const data = await getAssets();
      setAssets(data);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    let list = assets;
    if (categoryFilter) {
      list = list.filter((a) => a.category === categoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((a) => a.name.toLowerCase().includes(q));
    }
    return list;
  }, [assets, categoryFilter, searchQuery]);

// Group by parentAssetId to restore parent/child rendering and markers
  const groupedAssets = useMemo(() => {
    const map: Record<string, Asset[]> = {};
    for (const a of filtered) {
      const key = a.parentAssetId ?? "root";
      if (!map[key]) map[key] = [];
      map[key].push(a);
    }
    // Sort siblings by name for stable ordering using natural sort
    Object.keys(map).forEach((k) => map[k].sort((a, b) => naturalSort(a.name, b.name)));
    return map;
  }, [filtered]);

  // Sort root assets by category (defined order), then by name
  const sortedRootAssets = useMemo(() => {
    const roots = groupedAssets["root"] || [];
    return [...roots].sort((a, b) => {
      const ca = CATEGORY_ORDER[a.category];
      const cb = CATEGORY_ORDER[b.category];
      if (ca !== cb) return ca - cb;
      return naturalSort(a.name, b.name);
    });
  }, [groupedAssets]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this asset?")) return;
    await deleteAsset(id);
    loadAssets();
  }

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

  return (
    <Box display="flex" flexDirection="column" height="100%" p={6} overflow="hidden">
      {/* top, non-scrolling filters section */}
      <Box flexShrink={0} mb={4}>
        <HStack spacing={4} flexWrap="wrap">
          <Select
            placeholder="All categories"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            width={{ base: "100%", md: "220px" }}
          >
            {/* always show canonical list */}
            {ALLOWED_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>

          <Input
            placeholder="Search asset name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            width={{ base: "100%", md: "300px" }}
          />

          {/* New Asset button (opens the modal with empty form) */}
          <Button
            colorScheme="blue"
            onClick={() => {
              setEditingAsset(null);
              setShowForm(true);
            }}
          >
            New Asset
          </Button>

          {/* Bulk Import button */}
          <Button
            colorScheme="green"
            onClick={() => setShowBulkImport(true)}
            leftIcon={<span>📥</span>}
          >
            Bulk Import
          </Button>
        </HStack>
      </Box>

      {/* table area fills remaining space and scrolls only here */}
      <Box flex="1" overflow="auto">
        {loading ? (
          <Spinner />
        ) : (
          <TableContainer maxH="100%" overflowY="auto" overflowX="auto">
            <Table variant="simple" minW="900px" width="100%">
              <Thead>
                <Tr>
                  <Th position="sticky" top={0} bg="tableHeader">
                    Asset Name
                  </Th>
                  <Th position="sticky" top={0} bg="tableHeader">
                    Category
                  </Th>
                  <Th position="sticky" top={0} bg="tableHeader">
                    Active
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
                    Actions
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {sortedRootAssets.map((parent) => (
                  <ParentRow
                    key={parent.id}
                    asset={parent}
                    groupedAssets={groupedAssets}
                    onEdit={(a) => {
                      setEditingAsset(a);
                      setShowForm(true);
                    }}
                    onDelete={handleDelete}
                    level={0}
                    inheritedCategory={undefined}
                    collapsedParents={collapsedParents}
                    onToggleCollapse={toggleParentCollapse}
                  />
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {showForm && (
        <AddEditAssetForm
          asset={editingAsset}
          onClose={() => {
            setShowForm(false);
            setEditingAsset(null);
            loadAssets();
          }}
        />
      )}

      {showBulkImport && (
        <BulkImportModal
          isOpen={showBulkImport}
          onClose={() => setShowBulkImport(false)}
          onImportComplete={loadAssets}
        />
      )}
    </Box>
  );
}

// ParentRow: children inherit category from ancestor; marker "↳" shows relationship
function ParentRow({
  asset,
  groupedAssets,
  onEdit,
  onDelete,
  level = 0,
  inheritedCategory,
  collapsedParents,
  onToggleCollapse,
}: {
  asset: Asset;
  groupedAssets: Record<string, Asset[]>;
  onEdit: (a: Asset) => void;
  onDelete: (id: string) => void;
  level?: number;
  inheritedCategory?: AssetCategory;
  collapsedParents: Set<string>;
  onToggleCollapse: (parentId: string) => void;
}) {
  const displayCategory: AssetCategory = inheritedCategory ?? asset.category;
  const hasChildren = groupedAssets[asset.id]?.length > 0;
  const isCollapsed = collapsedParents.has(asset.id);

  return (
    <>
      <Tr>
        <Td style={{ paddingLeft: `${level * 20}px` }}>
          <Box display="flex" alignItems="center" gap={1}>
            {hasChildren && (
              <Button
                size="xs"
                variant="ghost"
                onClick={() => onToggleCollapse(asset.id)}
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
        <Td>{asset.active ? "Yes" : "No"}</Td>
        <Td>{getTrackingLabel(asset)}</Td>
        <Td>{getCurrentReading(asset) ?? "-"}</Td>
        <Td>{getNextDueDisplay(asset)}</Td>
        <Td>
          <Button size="sm" onClick={() => onEdit(asset)}>
            Edit
          </Button>
          <Button size="sm" colorScheme="red" ml={2} onClick={() => onDelete(asset.id)}>
            Delete
          </Button>
        </Td>
      </Tr>

      {!isCollapsed && (groupedAssets[asset.id] || []).map((child) => (
        <ParentRow
          key={child.id}
          asset={child}
          groupedAssets={groupedAssets}
          onEdit={onEdit}
          onDelete={onDelete}
          level={level + 1}
          inheritedCategory={displayCategory}
          collapsedParents={collapsedParents}
          onToggleCollapse={onToggleCollapse}
        />
      ))}
    </>
  );
}
