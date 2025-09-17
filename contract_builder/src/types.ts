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
  createdAt?: Date;
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
  totalCost: number;
  createdAt: Date;
  archived?: boolean;
  roomTotals?: Totals;
  diveTotals?: Totals;
  mealTotals?: Totals;
  overall?: Totals;
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