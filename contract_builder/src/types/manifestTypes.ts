import { Timestamp } from "firebase/firestore";
import { CrewRole } from "./crewTypes";

// Gear object shape (normalized MVP) - from spec
export type GearItem = { 
  needRental: boolean; 
  sizeText?: string; 
  sourceText?: string 
};

export type Gear = {
  bcd?: GearItem;
  regulator?: GearItem;
  wetsuit?: GearItem;
  fins?: GearItem;
  mask?: GearItem;
  computer?: GearItem;
  otherNotes?: string;
};

// Customer - aligned with spec
export interface Customer {
  id: string;
  // Identity
  fullName: string;
  emailLower: string | null;
  phoneE164: string | null;
  dob: string | null; // YYYY-MM-DD
  notesGeneral: string | null;
  accommodations: string | null; // Hotel/accommodation for taxi list

  // Dive certification (locked after verification)
  certLevel: string | null;
  certAgencyNumber: string | null;
  certVerified: boolean; // default false
  certVerifiedAt: Timestamp | null;
  certVerifiedBy: string | null;

  // Nitrox certification (separate from "wants nitrox")
  nitroxCertified: boolean | null;
  nitroxCertAgencyNumber: string | null;
  nitroxVerified: boolean; // default false
  nitroxVerifiedAt: Timestamp | null;
  nitroxVerifiedBy: string | null;

  // Diving history (update only when lastDive becomes more recent)
  lastDiveDate: string | null; // YYYY-MM-DD
  lifetimeDives: number | null;
  lastDiveDateSourceAt: Timestamp | null;

  // Gear (latest wins by submissionUpdatedAt)
  gearDefault: Gear;
  gearLastUpdatedAt: Timestamp | null;

  // Bookkeeping
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

// Stay collection - trip specific
export interface Stay {
  id?: string;
  customerId: string;
  bookingCode: string | null; // e.g., HHQB-010226
  externalDocId: string | null; // "Document" column
  arrivalDate: string; // YYYY-MM-DD
  arrivalDetails: string | null;
  departureDate: string; // YYYY-MM-DD
  departureDetails: string | null;
  accommodationName: string | null; // hotel/property only; no room
  participantsName: string | null;

  // Operational status
  status: "planned" | "in_house" | "checked_out"; // default planned
  checkedOutAt: Timestamp | null;

  // Imported workflow/status fields
  sourceStatus: string | null; // e.g., COMPLETE
  submissionUpdatedAt: Timestamp; // from CSV Updated Date, fallback Created Date
  importId: string;

  // Trip preferences
  nitroxPreference: "air" | "nitrox" | null;

  // Gear requested for this stay
  gearRequested: Gear;
  gearRequestedAt: Timestamp; // = submissionUpdatedAt

  // Bookkeeping
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Day Manifest - one per date
export interface DayManifest {
  id?: string;
  date: string; // YYYY-MM-DD
  status: "draft" | "published" | "completed"; // default draft
  notes: string | null;
  createdAt: Timestamp | any; // Allow FieldValue for serverTimestamp
  updatedAt: Timestamp | any; // Allow FieldValue for serverTimestamp

  // Optional header info (if desired for print)
  captainByBoat?: Record<string, string>;
  crewByBoat?: Record<string, string[]>;
}

// Day Manifest Row - one per person per day
export interface DayRow {
  id?: string;
  customerId: string;
  stayId: string | null; // active stay for that day, if any

  // Dive plan
  d1: boolean;
  d2: boolean;
  d3: boolean;
  nd: boolean;

  // Boat assignment
  d1BoatId: string | null;
  d2BoatId: string | null;
  d3BoatId: string | null;

  // Taxi
  needsTaxi: boolean;
  pickupLocationText: string | null; // default from stay.accommodationName
  dropoffLocationText: string | null; // default same as pickup
  taxiOverride?: {
    pickupRunId?: string;
    dropoffRunId?: string;
    noTaxiToday?: boolean;
  };

  // Day notes
  notes: string | null;

  // Bookkeeping
  createdAt: Timestamp | any; // Allow FieldValue for serverTimestamp
  updatedAt: Timestamp | any; // Allow FieldValue for serverTimestamp
}

// Taxi Run - editable per day
export interface TaxiRun {
  id?: string;
  direction: "to_harbor" | "from_harbor";
  timeLocal: string; // e.g., "08:30", "10:45", 24h preferred
  label?: string; // optional, e.g., "Extra run"
  isDefault: boolean;
  sortIndex?: number; // optional; otherwise sort by time
  createdAt: Timestamp | any; // Allow FieldValue for serverTimestamp
  updatedAt: Timestamp | any; // Allow FieldValue for serverTimestamp
}

// Import staging collections
export interface Import {
  id?: string;
  fileName: string;
  status: "pending" | "processing" | "completed" | "failed";
  totalRecords: number;
  processedRecords: number;
  errors: string[];
  createdAt: Timestamp;
  completedAt?: Timestamp;
}

export interface ImportRow {
  id?: string;
  // Raw fields from CSV
  rawFields: Record<string, string>;
  
  // Normalized fields
  emailLower: string | null;
  phoneE164: string | null;
  parsedDates: {
    arrivalDate?: string;
    departureDate?: string;
    lastDiveDate?: string;
  };
  parsedGear: Gear;
  
  // Match results
  matchCustomerId: string | null;
  matchType: "email" | "phone" | "none" | "conflict";
  needsReview: boolean;
  
  // Processing status
  processed: boolean;
  errors: string[];
  
  createdAt: Timestamp;
}

// Utility types for UI
export interface TaxiAssignmentDerived {
  customerId: string;
  customerName: string;
  pickupRunId?: string;
  pickupTime: string;
  pickupLocation: string;
  dropoffRunId?: string;
  dropoffTime: string;
  dropoffLocation: string;
  notes?: string;
  boats?: string[]; // boats assigned for dives
}

export interface ManifestValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Legacy types for backward compatibility
export interface ImportJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileName: string;
  totalRecords: number;
  processedRecords: number;
  errors: string[];
  createdAt: Date;
  completedAt?: Date;
}

export interface EquipmentItem {
  needed: boolean; // true = rental, false = own equipment
  size?: string; // "M/L", "XXS", etc.
  abbreviation: string; // For manifest display: "BCD-M/L", "OWN", etc.
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

export interface CrewManifestAssignment {
  crewId: string;
  role: CrewRole;
}

export interface CrewAssignment {
  assignments: CrewManifestAssignment[];
}

export interface TankRequirements {
  air: number;
  nitrox: number;
  total: number;
}

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

export interface DiveAssignment {
  id: string;
  customerId: string;
  diveSlotId: string;
  assignedAt: Date;
  assignedBy: string;
  tankType: 'air' | 'nitrox';
  equipmentProvided: {
    bcd: { needed: boolean; abbreviation: string };
    regulator: { needed: boolean; abbreviation: string };
    mask: { needed: boolean; abbreviation: string };
    fins: { needed: boolean; abbreviation: string };
    wetsuit: { needed: boolean; abbreviation: string };
    computer: { needed: boolean; abbreviation: string };
  };
  notes?: string;
}

export interface TaxiAssignment {
  id: string;
  customerId: string;
  taxiId: string;
  pickupTime: string;
  pickupLocation: string;
  dropoffTime: string;
  dropoffLocation: string;
  assignedAt: Date;
  assignedBy: string;
  notes?: string;
}

export interface Taxi {
  id: string;
  name: string;
  capacity: number;
  driverContact?: string;
  priority?: number;
  active: boolean;
}

export interface DailyManifest {
  id: string;
  date: Date;
  boatId: string;
  boatName: string;
  captain: string;
  crew: string[];
  diveSlots: DiveSlot[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyTaxiList {
  id: string;
  date: Date;
  assignments: TaxiAssignment[];
  createdAt: Date;
  updatedAt: Date;
}
