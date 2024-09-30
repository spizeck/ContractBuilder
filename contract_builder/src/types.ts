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

