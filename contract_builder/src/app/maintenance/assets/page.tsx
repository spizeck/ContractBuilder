"use client";

import { useEffect, useState } from "react";
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
import { getAssets, deleteAsset } from "@/services/assets";
import { Asset } from "@/types/maintenance";
import AddEditAssetForm from "./AddEditAssetForm";

// Allowed categories going forward — use these for filters and parent assignment
const ALLOWED_CATEGORIES = [
  "Marine",
  "Compressors",
  "Vehicles",
  "Scuba Equipment",
  "Other",
] as const;

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    loadAssets();
  }, []);

  async function loadAssets() {
    setLoading(true);
    try {
      const assetsData = await getAssets();
      setAssets(assetsData);
    } catch (error) {
      console.error("Failed to fetch assets:", error);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (confirm("Delete this asset?")) {
      try {
        await deleteAsset(id);
        await loadAssets();
        alert("Asset deleted successfully.");
      } catch (error) {
        console.error("Error deleting asset:", error);
        alert("Failed to delete asset. Please try again.");
      }
    }
  }

  // 🧩 Build parent → child map
  const groupedAssets = assets.reduce<Record<string, Asset[]>>((acc, asset) => {
    const key = asset.parentAssetId || "root";
    if (!acc[key]) acc[key] = [];
    acc[key].push(asset);
    return acc;
  }, {});

  // Categories for the UI filter: only from parent assets and restricted to allowed list
  const categories = ALLOWED_CATEGORIES.filter((c) =>
    (groupedAssets["root"] || []).some((p) => p.category === c)
  );

  return (
    <Box
      display="flex"
      flexDirection="column"
      height="100%"
      p={6}
      overflow="hidden"
    >
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
        </HStack>
      </Box>

      {/* table area fills remaining space and scrolls only here */}
      <Box flex="1" overflow="auto">
        {loading ? (
          <Spinner />
        ) : (
          <TableContainer
            maxH="100%"
            overflowY="auto"
            overflowX="auto"
            sx={{ WebkitOverflowScrolling: "touch" }}
          >
            <Table variant="simple" minW="720px" width="100%">
              <Thead>
                <Tr>
                  <Th position="sticky" top={0} bg="chakra-subtle-bg">
                    Asset Name
                  </Th>
                  <Th position="sticky" top={0} bg="chakra-subtle-bg">
                    Category
                  </Th>
                  <Th position="sticky" top={0} bg="chakra-subtle-bg">
                    Active
                  </Th>
                  <Th position="sticky" top={0} bg="chakra-subtle-bg">
                    Actions
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {(groupedAssets["root"] || [])
                  .filter((a) => (categoryFilter ? a.category === categoryFilter : true))
                  .filter((a) =>
                    searchQuery
                      ? a.name.toLowerCase().includes(searchQuery.toLowerCase())
                      : true
                  )
                  .sort((x, y) => {
                    const catA = (x.category || "").toLowerCase();
                    const catB = (y.category || "").toLowerCase();
                    if (catA < catB) return -1;
                    if (catA > catB) return 1;
                    const nameA = (x.name || "").toLowerCase();
                    const nameB = (y.name || "").toLowerCase();
                    if (nameA < nameB) return -1;
                    if (nameA > nameB) return 1;
                    return 0;
                  })
                  .map((parent) => (
                    <ParentRow
                      key={parent.id}
                      asset={parent}
                      groupedAssets={groupedAssets}
                      onEdit={(a) => {
                        setEditingAsset(a);
                        setShowForm(true);
                      }}
                      onDelete={handleDelete}
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

// ParentRow: show category from parent (if asset is a child) — children inherit parent's category
function ParentRow({
  asset,
  groupedAssets,
  onEdit,
  onDelete,
  level = 0,
}: {
  asset: Asset;
  groupedAssets: Record<string, Asset[]>;
  onEdit: (a: Asset) => void;
  onDelete: (id: string) => void;
  level?: number;
}) {
  // For display, if this row is a child (parentAssetId present), prefer parent's category.
  // However this component is used both for root parents and recursive children:
  const parent =
    asset.parentAssetId !== undefined
      ? (groupedAssets["root"] || []).find((p) => p.id === asset.parentAssetId) || null
      : null;
  const displayCategory = parent ? parent.category : asset.category;

  return (
    <>
      <Tr>
        <Td style={{ paddingLeft: `${level * 20}px` }}>
          {level > 0 && "↳ "}
          {asset.name}
        </Td>
        <Td>{displayCategory}</Td>
        <Td>{asset.active ? "Yes" : "No"}</Td>
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
        />
      ))}
    </>
  );
}
