// src/types/maintenance.ts

// Canonical categories (top-level groups)
export type AssetCategory =
  | "Marine"
  | "Compressors"
  | "Vehicles"
  | "Scuba Equipment"
  | "Scuba Tanks"
  | "Other";

// How an asset tracks service
export type ServiceTracking = "none" | "hours" | "kilometers" | "date";

// ---------- Base Asset ----------
export interface AssetBase {
  id: string;
  name: string;
  category: AssetCategory;
  description?: string;
  serialNumber?: string;        // ✅ optional
  location?: string;
  active: boolean;

  // hierarchy
  parentAssetId?: string;
  parentAssetName?: string;
  subAssetIds?: string[];

  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;

  /** @deprecated  — use new tracking fields below */
  hours?: number;
  /** @deprecated */
  nextServiceDue?: number;
  /** @deprecated */
  lastServiceDate?: Date;
}

// ---------- Tracking Variants ----------
export interface AssetServiceNone {
  serviceTracking: "none";
}

export interface AssetServiceHours {
  serviceTracking: "hours";
  currentHours?: number;
  serviceIntervalHours?: number;
  nextServiceDueHours?: number;
  lastServiceDate?: Date;
}

export interface AssetServiceKilometers {
  serviceTracking: "kilometers";
  currentKilometers?: number;
  serviceIntervalKilometers?: number;
  nextServiceDueKilometers?: number;
  lastServiceDate?: Date;
}

export interface AssetServiceDate {
  serviceTracking: "date";
  serviceIntervalDays?: number;
  nextServiceDueDate?: Date;
  lastServiceDate?: Date;
}

// ---------- Final Asset ----------
export type Asset =
  | (AssetBase & AssetServiceNone)
  | (AssetBase & AssetServiceHours)
  | (AssetBase & AssetServiceKilometers)
  | (AssetBase & AssetServiceDate);

// ---------- Type Guards ----------
export const isHoursTracked = (a: Asset): a is AssetBase & AssetServiceHours =>
  a.serviceTracking === "hours";

export const isKmTracked = (a: Asset): a is AssetBase & AssetServiceKilometers =>
  a.serviceTracking === "kilometers";

export const isDateTracked = (a: Asset): a is AssetBase & AssetServiceDate =>
  a.serviceTracking === "date";

// ---------- Technicians ----------
export interface Technician {
  id: string;
  name: string;
  role?: string;
  certifications?: string;
  active: boolean;
  // optional legacy metric used by some UIs; prefer computing from logs
  activityCount?: number;
}

// ---------- Maintenance Logs ----------
export type MaintenanceLogKind =
  | "service"
  | "unscheduled"
  | "inspection"
  | "note";

export interface MaintenanceLog {
  id: string;
  assetId: string;
  assetName: string;
  category: AssetCategory;
  kind: MaintenanceLogKind;

  // When & what
  date: Date;
  summary: string;
  details?: string;

  // Who
  technicianId?: string;
  technicianName?: string;

  // Measurements
  readingHours?: number;
  nextServiceDueHours?: number;
  readingKilometers?: number;
  nextServiceDueKilometers?: number;
  nextServiceDueDate?: Date;

  // Meta
  cost?: number;
  attachments?: string[];
  createdBy: string;
  createdAt: Date;

  /** @deprecated — old fields retained for migration only */
  hoursAtService?: number;
  nextServiceDue?: number;
}
