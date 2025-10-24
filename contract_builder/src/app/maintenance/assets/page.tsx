"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Heading,
  HStack,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Spinner,
  Select,
  Checkbox,
  TableContainer
} from "@chakra-ui/react";
import { getAssets, deleteAsset } from "@/services/assets";
import { Asset } from "@/types/maintenance";
import AddEditAssetForm from "./AddEditAssetForm";

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [activeOnly, setActiveOnly] = useState<boolean>(false);

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

  return (
    <Box p={6}>
      <Heading size="lg" mb={4}>
        Assets
      </Heading>

      <HStack mb={4} spacing={4} align="center">
        <Button colorScheme="blue" onClick={() => setShowForm(true)}>
          Add Asset
        </Button>

        <Select
          width="220px"
          placeholder="All categories"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          {[...new Set(assets.map((a) => a.category).filter(Boolean))]
            .sort()
            .map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
        </Select>

        <Checkbox isChecked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)}>
          Active only
        </Checkbox>
      </HStack>

      {loading ? (
        <Spinner />
      ) : (
        <TableContainer overflow="auto" maxH="60vh">
          <Table variant="simple" width="100%">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Category</Th>
                <Th>Active</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {(groupedAssets["root"] || [])
                .filter((a) => (categoryFilter ? a.category === categoryFilter : true))
                .filter((a) => (activeOnly ? Boolean(a.active) : true))
                .sort((x, y) => {
                  const catA = (x.category || "").toLowerCase()
                  const catB = (y.category || "").toLowerCase()
                  if (catA < catB) return -1
                  if (catA > catB) return 1
                  const nameA = (x.name || "").toLowerCase()
                  const nameB = (y.name || "").toLowerCase()
                  if (nameA < nameB) return -1
                  if (nameA > nameB) return 1
                  return 0
                })
                .map((parent) => (
                  <ParentRow
                    key={parent.id}
                    asset={parent}
                    groupedAssets={groupedAssets}
                    onEdit={(a) => {
                      setEditingAsset(a)
                      setShowForm(true)
                    }}
                    onDelete={handleDelete}
                  />
                ))}
            </Tbody>
          </Table>
        </TableContainer>
      )}

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
  return (
    <>
      <Tr>
        <Td style={{ paddingLeft: `${level * 20}px` }}>
          {level > 0 && "↳ "} {asset.name}
        </Td>
        <Td>{asset.category}</Td>
        <Td>{asset.active ? "Yes" : "No"}</Td>
        <Td>
          <Button size="sm" onClick={() => onEdit(asset)}>
            Edit
          </Button>
          <Button
            size="sm"
            colorScheme="red"
            ml={2}
            onClick={() => onDelete(asset.id)}
          >
            Delete
          </Button>
        </Td>
      </Tr>

      {groupedAssets[asset.id]?.map((child) => (
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
