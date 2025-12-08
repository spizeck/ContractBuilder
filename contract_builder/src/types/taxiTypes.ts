export interface Taxi {
  id: string;
  name: string;
  capacity: number;
  driverName?: string;
  driverContact?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
