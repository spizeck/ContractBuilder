// src/types/maintenance.ts
export interface Asset {
  id: string;
  name: string;
  // canonical allowed categories (only on parent assets going forward)
  category:
    | "Marine"
    | "Compressors"
    | "Vehicles"
    | "Scuba Equipment"
    | "Other";
  description?: string;
  serialNumber?: string;
  hours?: number;
  lastServiceDate?: Date;
  nextServiceDue?: number;
  active: boolean;
  parentAssetId?: string;
  parentAssetName?: string;
  subAssetIds?: string[];
  location?: string;
  metadata?: Record<string, any>;
  updatedAt?: Date;
  createdAt?: Date;
}

export interface Technician {
  id: string;
  name: string;
  role?: string;
  certifications?: string;
  active: boolean;
}

export interface MaintenanceLog {
  id: string;
  assetId: string;
  assetName: string;
  category: string;
  date: Date;
  technicianId: string;
  technicianName: string;
  summary: string;
  details: string;
  hoursAtService?: number;
  nextServiceDue?: number;
  cost?: number;
  attachments?: string[];
  createdBy: string;
  createdAt: Date;
}
