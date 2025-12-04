"use client";

import { useEffect, useMemo, useState } from "react";
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
  useColorModeValue,
} from "@chakra-ui/react";
import { getAssets, deleteAsset } from "@/services/assets";
import { Asset, AssetCategory } from "@/types/maintenance";
import AddEditAssetForm from "./AddEditAssetForm";
import {
  getTrackingLabel,
  getCurrentReading,
  getNextDueDisplay,
} from "@/utils/maintenanceSelectors";

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
  "Scuba Tanks": 4,
  Other: 5,
};

export default function AssetsPage() {
  const thBg = useColorModeValue("gray.50", "gray.800");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

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
    // Sort siblings by name for stable ordering
    Object.keys(map).forEach((k) => map[k].sort((a, b) => a.name.localeCompare(b.name)));
    return map;
  }, [filtered]);

  // Sort root assets by category (defined order), then by name
  const sortedRootAssets = useMemo(() => {
    const roots = groupedAssets["root"] || [];
    return [...roots].sort((a, b) => {
      const ca = CATEGORY_ORDER[a.category];
      const cb = CATEGORY_ORDER[b.category];
      if (ca !== cb) return ca - cb;
      return a.name.localeCompare(b.name);
    });
  }, [groupedAssets]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this asset?")) return;
    await deleteAsset(id);
    loadAssets();
  }

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
            ml="auto"
            colorScheme="blue"
            onClick={() => {
              setEditingAsset(null);
              setShowForm(true);
            }}
          >
            New Asset
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
                  <Th position="sticky" top={0} bg={thBg}>
                    Asset Name
                  </Th>
                  <Th position="sticky" top={0} bg={thBg}>
                    Category
                  </Th>
                  <Th position="sticky" top={0} bg={thBg}>
                    Active
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
}: {
  asset: Asset;
  groupedAssets: Record<string, Asset[]>;
  onEdit: (a: Asset) => void;
  onDelete: (id: string) => void;
  level?: number;
  inheritedCategory?: AssetCategory;
}) {
  const displayCategory: AssetCategory = inheritedCategory ?? asset.category;

  return (
    <>
      <Tr>
        <Td style={{ paddingLeft: `${level * 20}px` }}>
          {level > 0 && "↳ "}
          {asset.name}
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

      {(groupedAssets[asset.id] || []).map((child) => (
        <ParentRow
          key={child.id}
          asset={child}
          groupedAssets={groupedAssets}
          onEdit={onEdit}
          onDelete={onDelete}
          level={level + 1}
          inheritedCategory={displayCategory}
        />
      ))}
    </>
  );
}
