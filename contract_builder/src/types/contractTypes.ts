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
  customRates?: { [key: string]: number }; // Custom room rates for this contract
  hasCustomRates?: boolean; // Flag to indicate if custom rates are used
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
}

export interface MealPackage {
  id: string;
  hotelId: string;
  name: string;
  description: string;
  price: number; // Price per person total
  commissionRate: number; // Commission rate as a decimal (e.g., 0.1 for 10%)
  archived?: boolean;
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
  archived?: boolean;
}

export interface RoomCategory {
  id: string;
  hotelId: string;
  name: string;
  occupancyTypes: string[]; // e.g., ["Single", "Double", "Triple", "Quad"]
  archived?: boolean;
}

export interface Totals {
  gross: number
  foc?: number
  commission: number
  net: number
}

export interface GroupContract {
  id: string;
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
  customRates?: { [key: string]: number }; // Custom room rates for this contract
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
  paymentType: 'deposit' | 'partial' | 'full' | 'other';
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