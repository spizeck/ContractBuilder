import type { CrewRole } from "@/types/crewTypes";

// Customer data from booking engine
export interface Customer {
  id: string;
  bookingReference: string; // From "Booking" column - useful for API integration
  documentId: string; // From "Document" column - waiver document ID
  fullName: string; // From "Name" column
  age?: string; // From "Age" column
  email?: string; // From "Email" column
  phone?: string; // From "Phone Number" column
  accommodations?: string; // From "Accommodations" column (replaces hotel)
  certificationLevel: string; // From "Certification Level" column
  certificationAgency?: string; // From "Certification Agency and Number" column
  nitroxCertified: boolean; // From "Nitrox Certification Agency and Number" column
  equipmentNeeded: EquipmentNeeds;
  specialRequirements?: string; // From "Is there anything else you would like for us to know?" column
  lastDiveDate?: string; // From "Date of Last Dive" column
  totalDives?: string; // From "Number of Dives in your Lifetime" column
  createdAt: Date;
  updatedAt: Date;
}

export interface EquipmentNeeds {
  bcd: EquipmentItem;
  regulator: EquipmentItem;
  mask: EquipmentItem;
  fins: EquipmentItem;
  wetsuit: EquipmentItem;
  computer?: EquipmentItem;
  other?: string;
}

export interface EquipmentItem {
  needed: boolean; // true = rental, false = own equipment
  size?: string; // "M/L", "XXS", etc.
  abbreviation: string; // For manifest display: "BCD-M/L", "OWN", etc.
}

// Dive slot configuration
export interface DiveSlot {
  id: string;
  date: Date;
  boatId: string;
  slotNumber: 1 | 2 | 3 | 4; // Up to 4 dive slots per day
  siteId?: string;
  departureTime: string; // "08:00", "10:30", etc.
  returnTime: string;
  maxDivers: number;
  currentAssignments: number;
  crew?: CrewAssignment;
  createdAt: Date;
}

export interface CrewManifestAssignment {
  crewId: string;
  role: CrewRole;
}

export interface CrewAssignment {
  assignments: CrewManifestAssignment[];
}

// Customer assignment to dive slots
export interface DiveAssignment {
  id: string;
  customerId: string;
  diveSlotId: string;
  assignedAt: Date;
  assignedBy: string; // User ID
  tankType: 'air' | 'nitrox';
  equipmentProvided: EquipmentNeeds;
  notes?: string;
}

// Taxi scheduling
export interface TaxiAssignment {
  id: string;
  customerId: string;
  diveSlotId: string;
  taxiId: 1 | 2; // Support for 2 taxis
  pickupTime: string;
  pickupLocation: string;
  destination: string;
  numberOfPassengers: number;
  specialInstructions?: string;
  scheduledAt: Date;
}

// Taxi configuration
export interface Taxi {
  id: 1 | 2;
  name: string;
  capacity: number;
  driverContact?: string;
  active: boolean;
}

// Manifest generation data
export interface DailyManifest {
  id: string;
  date: Date;
  boatId: string;
  diveSlots: DiveSlot[];
  assignments: DiveAssignment[];
  crew: CrewAssignment;
  tankRequirements: TankRequirements;
  generatedAt: Date;
  generatedBy: string;
}

export interface TankRequirements {
  air: number;
  nitrox: number;
  total: number;
}

// Taxi list for the day
export interface DailyTaxiList {
  id: string;
  date: Date;
  taxiAssignments: TaxiAssignment[];
  generatedAt: Date;
  generatedBy: string;
}

export interface ImportJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRecords: number;
  processedRecords: number;
  errors: string[];
  createdAt: Date;
  completedAt?: Date;
}
