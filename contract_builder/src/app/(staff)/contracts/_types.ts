export interface Addon {
  description: string;
  amount: number;
}

export interface ContractData {
  id?: string;
  groupName?: string;
  startDate?: string;
  endDate?: string;
  hotelId?: string;
  bookingType?: string;
  rooms?: RoomSelection[];
  divePackageId?: string;
  numDivers?: number;
  mealPackageId?: string;
  hotelAddons?: Addon[];
  diveAddons?: Addon[];
  mealAddons?: Addon[];
  createdAt?: Date;
  customRates?: Record<number, number>; // Custom room rates for this contract
  hasCustomRates?: boolean; // Flag to indicate if custom rates are used
  focOverrideIndex?: number | null; // Room cost index selected as FOC base rate override
  // Checkfront integration
  checkfrontBookingId?: string; // Manually entered Checkfront booking ID
}

export interface RoomSelection {
  categoryId: string;
  occupancyType: string;
  numRooms: number;
}

export interface DivePackage {
  id: string;
  name: string;
  description: string;
  price: number;
  archived?: boolean;
  checkfrontItemId?: string | null;
}

export interface MealPackage {
  id: string;
  hotelId: string;
  name: string;
  description: string;
  price: number; // Price per person total
  commissionRate: number; // Commission rate as a decimal (e.g., 0.1 for 10%)
  archived?: boolean;
  checkfrontItemId?: string | null;
}

export interface Hotel {
  id: string;
  name: string;
  location: string;
  description: string;
  contactInfo: string;
  amenities: string;
  policies: string;
  restrictions: string;
  focRule?: string; // Free of Charge rule, e.g. "7+1"
  focBaseRate?: string; // Base room type for FOC rule
  mealCommissionRate?: number; // Commission rate for meal packages
  logoUrl?: string; // Hotel logo URL (recommended: 300x100px)
  archived?: boolean;
}

export interface RoomCategory {
  id: string;
  hotelId: string;
  name: string;
  occupancyTypes: string[]; // e.g., ["Single", "Double", "Triple", "Quad"]
  archived?: boolean;
  checkfrontItemIds?: {
    Single?: string;
    Double?: string;
    Triple?: string;
    Quad?: string;
  };
}

export interface Totals {
  gross: number
  foc?: number
  commission: number
  net: number
}

export interface GroupContract {
  id: string;
  revisionOfContractId?: string;
  rootContractId?: string;
  revisionNumber?: number;
  groupName: string;
  startDate: string;
  endDate: string;
  hotelId: string;
  hotelName: string;
  seasonId: string;
  seasonName: string;
  bookingType: string;
  rooms: RoomSelection[];
  roomCosts: { description: string; cost: number }[];
  totalRoomCost: number;
  totalGuests: number;
  numDivers: number;
  totalNonDivers: number;
  divePackageId?: string;
  divePackageName?: string | null;
  divePackageCost?: number | null;
  mealPackageId?: string;
  mealPackageName?: string | null;
  mealPackageCost?: number | null;
  mealCommissionRate?: number; // Commission rate for meal packages
  hotelAddons?: Addon[];
  diveAddons?: Addon[];
  mealAddons?: Addon[];
  totalCost: number;
  createdAt: Date;
  archived?: boolean;
  roomTotals?: Totals;
  diveTotals?: Totals;
  mealTotals?: Totals;
  overall?: Totals;
  customRates?: Record<number, number>; // Custom room rates for this contract
  hasCustomRates?: boolean; // Flag to indicate if custom rates are used
  signedContractUrl?: string; // URL to the uploaded signed contract PDF
  signedContractUploadedAt?: Date; // When the signed contract was uploaded
  signedContractUploadedBy?: string; // UID of user who uploaded the signed contract
  signedContractUploadedByName?: string; // Display name of user who uploaded the signed contract
  // Payment tracking fields
  depositRequired?: number; // Deposit amount required
  depositPaid?: boolean; // Whether deposit has been paid
  depositPaidAt?: Date; // When deposit was paid
  depositPaidBy?: string; // Who paid the deposit
  totalPaid?: number; // Total amount paid so far
  paidInFull?: boolean; // Whether contract is paid in full
  paidInFullAt?: Date; // When contract was paid in full
  paidInFullBy?: string; // Who marked as paid in full
  paymentStatus?: 'unpaid' | 'deposit-paid' | 'paid-in-full'; // Overall payment status
  // Checkfront integration
  checkfrontSync?: CheckfrontSyncInfo;
}

export interface Rate {
  id: string;
  hotelId: string;
  categoryId: string;
  seasonId: string;
  occupancyType: string;
  price: number;
  archived?: boolean;
}

export interface Season {
  id: string;
  hotelId: string;
  name: string;
  startDate: string;
  endDate: string;
  archived?: boolean;
}

export interface RoomType {
  id: string;
  hotelId: string;
  categoryId: string;
  name: string;
  description: string;
  quantity: number;
  isFocBase: boolean;
  archived?: boolean;
}

export interface Payment {
  id: string;
  contractId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: 'check' | 'wire' | 'card' | 'cash';
  paymentType: 'deposit' | 'full' | 'other';
  status: 'pending' | 'confirmed' | 'failed';
  notes?: string;
  paymentDocumentUrl?: string;
  paymentDocumentType?: 'check' | 'wire-confirmation' | 'receipt' | 'other';
  createdAt: Date;
  createdBy: string;
  createdByName?: string;
}

export interface ContractNote {
  id: string;
  text: string;
  createdAt: Date;
  createdBy: string;
  createdByName?: string;
}

export interface HotelSheetConfig {
  hotelId: string;
  seasonIds: string[];
  divePackageIds: string[];
  mealPackageIds: string[];
  includeDescription: boolean;
  includeContactInfo: boolean;
  includeAmenities: boolean;
  includePolicies: boolean;
  includeRestrictions: boolean;
  includeLogo: boolean;
  includeMealCommissionInfo: boolean;
}

export interface HotelSheetRoomInventoryRow {
  roomTypeId: string;
  roomTypeName: string;
  roomCategoryId: string;
  roomCategoryName: string;
  quantity: number;
  description?: string;
}

export interface HotelSheetCategoryRateRow {
  roomCategoryId: string;
  roomCategoryName: string;
  occupancyType: string;
  nightlyRate: number;
  sevenNightTotal: number;
  sevenNightPerPerson: number;
}

export interface HotelSheetSeasonRates {
  seasonId: string;
  seasonName: string;
  startDate: string;
  endDate: string;
  categoryRates: HotelSheetCategoryRateRow[];
}

export interface HotelSheetOptions {
  includeDescription: boolean;
  includeContactInfo: boolean;
  includeAmenities: boolean;
  includePolicies: boolean;
  includeRestrictions: boolean;
  includeLogo: boolean;
  includeMealCommissionInfo: boolean;
}

export interface HotelSheetViewModel {
  hotel: Hotel | null;
  roomInventory: HotelSheetRoomInventoryRow[];
  seasons: HotelSheetSeasonRates[];
  divePackages: DivePackage[];
  mealPackages: MealPackage[];
  generatedAt: string;
  options: HotelSheetOptions;
}

export const defaultHotelSheetConfig: HotelSheetConfig = {
  hotelId: '',
  seasonIds: [],
  divePackageIds: [],
  mealPackageIds: [],
  includeDescription: true,
  includeContactInfo: true,
  includeAmenities: true,
  includePolicies: true,
  includeRestrictions: false,
  includeLogo: true,
  includeMealCommissionInfo: false,
};

// ============================================================================
// Checkfront Integration Types
// ============================================================================

export type CheckfrontSyncStatus =
  | 'not_linked'
  | 'pending_create'
  | 'linked'
  | 'sync_error';

export type CheckfrontSyncDirection =
  | 'app_to_checkfront'
  | 'checkfront_to_app'
  | 'manual_link';

export interface CheckfrontSyncInfo {
  bookingId?: string;
  bookingUrl?: string;
  status?: CheckfrontSyncStatus;
  lastSyncedAt?: Date | null;
  lastSyncDirection?: CheckfrontSyncDirection;
  lastError?: string | null;
  sessionId?: string | null;
  customerId?: string | null;
  manuallyLinked?: boolean; // True if bookingId was manually entered by staff
}

// Default Checkfront sync state for new contracts
export const defaultCheckfrontSync: CheckfrontSyncInfo = {
  status: 'not_linked',
  lastError: null,
  lastSyncedAt: null,
};

export type CheckfrontMappingEntityType =
  | 'hotel'
  | 'roomCategory'
  | 'roomType'
  | 'mealPackage'
  | 'divePackage'
  | 'addon';

export interface CheckfrontItemMapping {
  id?: string;
  hotelId?: string | null;
  localEntityType: CheckfrontMappingEntityType;
  localEntityId: string;
  checkfrontItemId: string;
  checkfrontCategoryId?: string | null;
  itemType: 'room' | 'dive' | 'meal' | 'addon';
  optionMappings?: Record<string, string>;
  rateSource?: 'manual_map' | 'synced_catalog';
  active: boolean;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CheckfrontSyncLog {
  id?: string;
  action: 'create_booking' | 'update_booking';
  success: boolean;
  requestSummary?: Record<string, unknown>;
  responseSummary?: Record<string, unknown>;
  error?: string | null;
  createdAt?: Date;
}