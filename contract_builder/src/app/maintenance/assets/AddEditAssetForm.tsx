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
import { Asset, ServiceTracking, AssetCategory } from "@/types/maintenance";

// Props
interface Props {
  asset: Asset | null;
  onClose: () => void;
}

// Canonical categories
const ALLOWED_CATEGORIES: AssetCategory[] = [
  "Marine",
  "Compressors",
  "Vehicles",
  "Scuba Equipment",
  "Other",
];

export default function AddEditAssetForm({ asset, onClose }: Props) {
  // Flat form state to avoid union typing issues
  type FormState = {
    name?: string;
    category?: AssetCategory;
    description?: string;
    serialNumber?: string;
    active?: boolean;
    parentAssetId?: string;
    parentAssetName?: string;
    location?: string;
    metadata?: Record<string, any>;
    serviceTracking: ServiceTracking;
    // hours mode
    currentHours?: number;
    serviceIntervalHours?: number;
    nextServiceDueHours?: number;
    // kilometers mode
    currentKilometers?: number;
    serviceIntervalKilometers?: number;
    nextServiceDueKilometers?: number;
    // date mode
    serviceIntervalDays?: number;
    nextServiceDueDate?: Date;
    // common optional
    lastServiceDate?: Date;
  };

  const initialForm = (): FormState => {
    if (!asset) {
      return {
        active: true,
        category: "Marine",
        serviceTracking: "none",
      };
    }
    const base: FormState = {
      name: asset.name,
      category: asset.category,
      description: asset.description,
      serialNumber: (asset as any).serialNumber,
      active: asset.active,
      parentAssetId: asset.parentAssetId,
      parentAssetName: asset.parentAssetName,
      location: asset.location,
      metadata: asset.metadata,
      serviceTracking: asset.serviceTracking,
      lastServiceDate: (asset as any).lastServiceDate,
    };
    if (asset.serviceTracking === "hours") {
      return {
        ...base,
        currentHours: asset.currentHours,
        serviceIntervalHours: asset.serviceIntervalHours,
        nextServiceDueHours: asset.nextServiceDueHours,
      };
    }
    if (asset.serviceTracking === "kilometers") {
      return {
        ...base,
        currentKilometers: asset.currentKilometers,
        serviceIntervalKilometers: asset.serviceIntervalKilometers,
        nextServiceDueKilometers: asset.nextServiceDueKilometers,
      };
    }
    if (asset.serviceTracking === "date") {
      return {
        ...base,
        serviceIntervalDays: asset.serviceIntervalDays,
        nextServiceDueDate: asset.nextServiceDueDate,
      };
    }
    return base;
  };

  const [form, setForm] = useState<FormState>(initialForm());
  const [loading, setLoading] = useState(false);
  const [allAssets, setAllAssets] = useState<Asset[]>([]);

  useEffect(() => {
    getAssets().then((data) => {
      setAllAssets(data.filter((a) => a.id !== asset?.id));
    });
  }, [asset]);

  function clean<T extends Record<string, any>>(obj: T): T {
    return Object.fromEntries(
      Object.entries(obj).filter(([_, v]) => v !== undefined)
    ) as T;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.category) {
      alert("Please provide a name and category.");
      return;
    }

    setLoading(true);
    const now = new Date();
    const tracking = form.serviceTracking || "none";

    const base: Partial<Asset> = {
      name: form.name!,
      category: form.category!,
      description: form.description || "",
      serialNumber: form.serialNumber || "",
      active: form.active ?? true,
      parentAssetId: form.parentAssetId,
      parentAssetName: form.parentAssetName,
      location: form.location,
      metadata: form.metadata || {},
      serviceTracking: tracking as ServiceTracking,
      updatedAt: now,
    };

    let trackingFields: Partial<Asset> = {};
    if (tracking === "hours") {
      trackingFields = {
        currentHours: form.currentHours,
        serviceIntervalHours: form.serviceIntervalHours,
        nextServiceDueHours: form.nextServiceDueHours,
        lastServiceDate: form.lastServiceDate,
      } as Partial<Asset>;
    } else if (tracking === "kilometers") {
      trackingFields = {
        currentKilometers: form.currentKilometers,
        serviceIntervalKilometers: form.serviceIntervalKilometers,
        nextServiceDueKilometers: form.nextServiceDueKilometers,
        lastServiceDate: form.lastServiceDate,
      } as Partial<Asset>;
    } else if (tracking === "date") {
      trackingFields = {
        serviceIntervalDays: form.serviceIntervalDays,
        nextServiceDueDate: form.nextServiceDueDate,
        lastServiceDate: form.lastServiceDate,
      } as Partial<Asset>;
    }

    try {
      if (asset?.id) {
        await updateAsset(asset.id, clean({ ...base, ...trackingFields }));
      } else {
        await addAsset(
          clean({
            ...(base as Omit<Asset, "id">),
            ...(trackingFields as Omit<Asset, "id">),
            createdAt: now,
          })
        );
      }
      onClose();
    } catch (err) {
      console.error("Error saving asset", err);
      alert("Failed to save asset.");
    } finally {
      setLoading(false);
    }
  }

  const tracking = form.serviceTracking;

  return (
    <Modal isOpen onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit} autoComplete="off">
        <ModalHeader>{asset ? "Edit Asset" : "Add Asset"}</ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Name */}
            <FormControl isRequired>
              <FormLabel>Name</FormLabel>
              <Input
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </FormControl>

            {/* Category */}
            <FormControl isRequired>
              <FormLabel>Category</FormLabel>
              <Select
                value={form.category ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category: e.target.value as AssetCategory,
                  })
                }
              >
                {ALLOWED_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </FormControl>

            {/* Parent */}
            <FormControl>
              <FormLabel>Parent Asset</FormLabel>
              <Select
                placeholder="None"
                value={form.parentAssetId || ""}
                onChange={(e) => {
                  const parent = allAssets.find((a) => a.id === e.target.value);
                  setForm({
                    ...form,
                    parentAssetId: parent?.id,
                    parentAssetName: parent?.name,
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

            {/* Service tracking */}
            <FormControl>
              <FormLabel>Service Tracking</FormLabel>
              <Select
                value={tracking}
                onChange={(e) =>
                  setForm({
                    ...form,
                    serviceTracking: e.target.value as ServiceTracking,
                    // optionally clear fields when switching modes
                    currentHours: undefined,
                    serviceIntervalHours: undefined,
                    nextServiceDueHours: undefined,
                    currentKilometers: undefined,
                    serviceIntervalKilometers: undefined,
                    nextServiceDueKilometers: undefined,
                    serviceIntervalDays: undefined,
                    nextServiceDueDate: undefined,
                  })
                }
              >
                <option value="none">None</option>
                <option value="hours">Hours</option>
                <option value="kilometers">Kilometers</option>
                <option value="date">Date</option>
              </Select>
            </FormControl>

            {/* Dynamic sections */}
            {tracking === "hours" && (
              <>
                <NumberField
                  label="Current Hours"
                  value={form.currentHours}
                  onChange={(v) => setForm({ ...form, currentHours: v })}
                />
                <NumberField
                  label="Service Interval (hours)"
                  value={form.serviceIntervalHours}
                  onChange={(v) =>
                    setForm({ ...form, serviceIntervalHours: v })
                  }
                />
                <NumberField
                  label="Next Service Due (hours)"
                  value={form.nextServiceDueHours}
                  onChange={(v) => setForm({ ...form, nextServiceDueHours: v })}
                />
              </>
            )}

            {tracking === "kilometers" && (
              <>
                <NumberField
                  label="Current Kilometers"
                  value={form.currentKilometers}
                  onChange={(v) => setForm({ ...form, currentKilometers: v })}
                />
                <NumberField
                  label="Service Interval (km)"
                  value={form.serviceIntervalKilometers}
                  onChange={(v) =>
                    setForm({ ...form, serviceIntervalKilometers: v })
                  }
                />
                <NumberField
                  label="Next Service Due (km)"
                  value={form.nextServiceDueKilometers}
                  onChange={(v) =>
                    setForm({ ...form, nextServiceDueKilometers: v })
                  }
                />
              </>
            )}

            {tracking === "date" && (
              <>
                <NumberField
                  label="Service Interval (days)"
                  value={form.serviceIntervalDays}
                  onChange={(v) => setForm({ ...form, serviceIntervalDays: v })}
                />
                <FormControl>
                  <FormLabel>Next Service Due (date)</FormLabel>
                  <Input
                    type="date"
                    value={
                      form.nextServiceDueDate
                        ? new Date(form.nextServiceDueDate)
                            .toISOString()
                            .slice(0, 10)
                        : ""
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        nextServiceDueDate: e.target.value
                          ? new Date(e.target.value)
                          : undefined,
                      })
                    }
                  />
                </FormControl>
              </>
            )}

            {/* Last service date */}
            <FormControl>
              <FormLabel>Last Service Date</FormLabel>
              <Input
                type="date"
                value={
                  form.lastServiceDate
                    ? new Date(form.lastServiceDate).toISOString().slice(0, 10)
                    : ""
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    lastServiceDate: e.target.value
                      ? new Date(e.target.value)
                      : undefined,
                  })
                }
              />
            </FormControl>

            {/* Active */}
            <FormControl display="flex" alignItems="center">
              <FormLabel mb="0">Active</FormLabel>
              <Switch
                isChecked={form.active ?? true}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
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
      </ModalContent>
    </Modal>
  );
}

// 🧩 Small helper for numeric fields
function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: number;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <FormControl>
      <FormLabel>{label}</FormLabel>
      <Input
        type="number"
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value === "" ? undefined : Number(e.target.value))
        }
      />
    </FormControl>
  );
}
