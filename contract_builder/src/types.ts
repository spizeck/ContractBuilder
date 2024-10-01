export interface ContractData {
  groupName?: string;
  startDate?: string;
  endDate?: string;
  hotelId?: string;
  bookingType?: string;
  rooms?: RoomSelection[];
  divePackageId?: string;
  numDivers?: number;
  mealPackageId?: string;
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
}

export interface MealPackage {
  id: string;
  hotelId: string;
  name: string;
  description: string;
  price: number; // Price per person total
}

export interface Hotel {
  id: string;
  name: string;
  location: string;
  description: string;
  contactInfo: string;
  amenities: string;
  policies: string;
}

export interface RoomCategory {
  id: string;
  hotelId: string;
  name: string;
  occupancyTypes: string[]; // e.g., ["Single", "Double", "Triple", "Quad"]
}

export interface GroupContract {
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
  divePackageName?: string;
  divePackageCost?: number;
  mealPackageId?: string;
  mealPackageName?: string;
  mealPackageCost?: number;
  totalCost: number;
  createdAt: Date;
  // Add other fields as needed
}

export interface Rate {
  id: string;
  hotelId: string;
  categoryId: string;
  seasonId: string;
  occupancyType: string;
  price: number;
}

export interface Season {
  id: string;
  hotelId: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface RoomType {
  id: string;
  hotelId: string;
  categoryId: string;
  name: string;
  description: string;
  quantity: number;
}