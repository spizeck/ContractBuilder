"use client";

import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Switch,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { addAsset, updateAsset, getAssets } from "@/services/assets";
import { Asset } from "@/types/maintenance";

interface Props {
  asset: Asset | null;
  onClose: () => void;
}

export default function AddEditAssetForm({ asset, onClose }: Props) {
  const [form, setForm] = useState<Partial<Asset>>(
    asset || { active: true, category: "Marine" }
  );
  const [loading, setLoading] = useState(false);
  const [allAssets, setAllAssets] = useState<Asset[]>([]);

  function removeUndefined<T extends object>(obj: T): T {
    return Object.fromEntries(
      Object.entries(obj).filter(([_, v]) => v !== undefined)
    ) as T;
  }

  useEffect(() => {
    async function loadAssets() {
      const data = await getAssets();
      // exclude itself from being its own parent
      setAllAssets(data.filter((a) => a.id !== asset?.id));
    }
    loadAssets();
  }, [asset]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // --- Basic validation ---
      if (!form.name || !form.category) {
        alert("Please provide a name and category.");
        return;
      }

      if (asset?.id) {
        await updateAsset(asset.id, form);
      } else {
        const newAsset: Omit<Asset, "id"> = {
          name: form.name,
          category: form.category,
          description: form.description || "",
          serialNumber: form.serialNumber || "",
          hours: form.hours,
          lastServiceDate: form.lastServiceDate,
          nextServiceDue: form.nextServiceDue,
          active: form.active ?? true,
          parentAssetId: form.parentAssetId,
          parentAssetName: form.parentAssetName,
          subAssetIds: form.subAssetIds || [],
          location: form.location,
          metadata: form.metadata || {},
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await addAsset(removeUndefined(newAsset));
      }

      onClose();
    } catch (error) {
      console.error("Error saving asset:", error);
      alert("Failed to save asset.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{asset ? "Edit Asset" : "Add Asset"}</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input
                  value={form.name || ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Category</FormLabel>
                <Select
                  value={form.category}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      category: e.target.value as Asset["category"],
                    })
                  }
                >
                  <option value="Boat">Boat</option>
                  <option value="Compressor">Compressor</option>
                  <option value="Vehicle">Vehicle</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Engine">Engine</option>
                  <option value="Other">Other</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Parent Asset</FormLabel>
                <Select
                  placeholder="None"
                  value={form.parentAssetId || ""}
                  onChange={(e) => {
                    const selected = allAssets.find(
                      (a) => a.id === e.target.value
                    );
                    setForm({
                      ...form,
                      parentAssetId: selected?.id || undefined,
                      parentAssetName: selected?.name || undefined,
                    });
                  }}
                >
                  {allAssets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.category})
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={form.description || ""}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel>Serial / Identifier</FormLabel>
                <Input
                  value={form.serialNumber || ""}
                  onChange={(e) =>
                    setForm({ ...form, serialNumber: e.target.value })
                  }
                />
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">Active</FormLabel>
                <Switch
                  isChecked={form.active ?? true}
                  onChange={(e) =>
                    setForm({ ...form, active: e.target.checked })
                  }
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button mr={3} onClick={onClose} variant="ghost">
              Cancel
            </Button>
            <Button type="submit" colorScheme="blue" isLoading={loading}>
              {asset ? "Save Changes" : "Add Asset"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
