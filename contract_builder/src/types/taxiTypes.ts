export interface Taxi {
  id: string;
  name: string;
  capacity: number;
  priority?: number;
  driverName?: string;
  driverContact?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
