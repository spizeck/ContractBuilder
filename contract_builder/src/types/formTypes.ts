// Form-specific types for better type safety

export interface MaintenanceLogForm {
  date: string;
  assetId: string;
  summary: string;
  details?: string;
  technicianId?: string;
  kind: "service" | "unscheduled" | "inspection" | "note";
  readingHours?: number;
  nextServiceDueHours?: number;
  readingKilometers?: number;
  nextServiceDueKilometers?: number;
  nextServiceDueDate?: string;
  cost?: number;
  attachments?: string[];
  // Legacy fields for backward compatibility
  hoursAtService?: number;
  nextServiceDue?: number;
}

export interface DiveLogForm {
  date: string;
  diveSiteId: string;
  diveSlot: string;
  boatId: string;
  diveGuide: string;
  maxDepth: number;
  waterTemperature: number;
  sightings: Array<{ speciesId: string; count: number }>;
}

export interface ContractForm {
  groupName?: string;
  startDate?: string;
  endDate?: string;
  hotelId?: string;
  bookingType?: string;
  rooms?: Array<{
    categoryId: string;
    occupancyType: string;
    numRooms: number;
  }>;
  divePackageId?: string;
  numDivers?: number;
  mealPackageId?: string;
  customRates?: Record<string, number>;
}

export interface HotelForm {
  name: string;
  description?: string;
  location?: string;
  contactInfo?: string;
  amenities?: string;
  policies?: string;
  restrictions?: string;
  focRule?: string;
}

export interface AssetForm {
  name: string;
  category: "Marine" | "Compressors" | "Vehicles" | "Scuba Equipment" | "Other";
  description?: string;
  serialNumber?: string;
  location?: string;
  active: boolean;
  parentAssetId?: string;
  serviceTracking: "none" | "hours" | "kilometers" | "date";
  currentHours?: number;
  serviceIntervalHours?: number;
  currentKilometers?: number;
  serviceIntervalKilometers?: number;
  serviceIntervalDays?: number;
}

export interface TechnicianForm {
  name: string;
  role?: string;
  certifications?: string;
  active: boolean;
}
