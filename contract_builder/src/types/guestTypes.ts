import type { Timestamp } from "firebase/firestore";

export type DataPriority = "high" | "medium" | "low";
export type GuestSource = "waiver_import" | "manual" | "checkfront";

export interface Guest {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  accommodations?: string;
  bookingId?: number;
  bookingCode?: string;
  
  // Group context
  groupPosition?: number; // 1st, 2nd, 3rd person in booking
  isGroupLead?: boolean; // Primary contact for the booking
  relatedGuestIds?: string[]; // Other guests in same booking
  
  // Identity confidence
  source: GuestSource;
  importBatchId?: string;
  lastVerifiedAt?: Timestamp;
  dataPriority: DataPriority;
  
  // Duplicate handling
  duplicateStatus: 'clean' | 'potential_duplicate' | 'confirmed_unique' | 'merged';
  duplicateNotes?: string;
  mergedIntoGuestId?: string; // If this is a duplicate that was merged
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: string;
  lastUpdatedBy?: string;
  
  // Dive-specific
  certificationLevel?: string;
  certificationAgency?: string;
  nitroxCertified?: boolean;
  specialRequirements?: string;
  lastDiveDate?: string;
  totalDives?: number;
  emergencyContact?: string;
  medicalNotes?: string;
  
  // Equipment needs
  equipment?: EquipmentNeeds;
  
  // Travel details (for taxi scheduling)
  arrivalDate?: string;
  arrivalDetails?: string;
  departureDate?: string;
  departureDetails?: string;
  
  // Waiver metadata
  waiverDocumentId?: string; // The "Document" ID from CSV
  waiverCompletedDate?: string;
  waiverStatus?: 'COMPLETE' | 'INCOMPLETE';
  
  // Legacy fields for compatibility
  matchStatus?: "matched" | "unmatched" | "duplicate" | "needs_review";
  matchConfidence?: number;
  conflicts?: FieldConflict[];
  duplicateIds?: string[];
  validationErrors?: ValidationError[];
  validationWarnings?: ValidationWarning[];
}

export interface ImportBatch {
  id: string;
  fileName: string;
  importedAt: Timestamp;
  importedBy: string;
  guestCount: number;
  duplicateCount: number;
  status: "processing" | "completed" | "error";
  errors?: ImportError[];
}

export interface DuplicateGroup {
  id: string;
  suspects: Guest[];
  matchReasons: string[];
  confidence: 'high' | 'medium' | 'low';
  resolutionStatus: 'pending' | 'reviewed' | 'resolved';
  resolutionAction?: 'merged' | 'confirmed_different' | 'needs_more_info';
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  notes?: string;
}

export interface BookingGroup {
  bookingId: number;
  bookingCode?: string;
  guests: Guest[];
  expectedCount?: number; // From Checkfront
  actualCount: number;
  status: 'complete' | 'missing_guests' | 'excess_guests' | 'needs_review';
  primaryContact?: Guest;
}

export interface ImportError {
  row: number;
  field: string;
  value: string;
  reason: string;
  suggestion?: string;
}

export interface DuplicateMatch {
  existingGuest: Guest;
  newGuest: Partial<Guest>;
  matchType: "exact" | "fuzzy_name" | "email" | "phone" | "booking_id";
  confidence: number; // 0-1
  conflicts: FieldConflict[]; // Fields that differ
}

export interface FieldConflict {
  field: keyof Guest;
  existingValue: any;
  incomingValue: any;
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

export interface GuestFilter {
  searchTerm?: string;
  matchStatus?: Guest['matchStatus'];
  certificationLevel?: string;
  accommodations?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  importBatchId?: string;
  source?: Guest['source'];
}

export interface GuestValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  row?: number;
}

export interface ValidationWarning {
  field: string;
  message: string;
  row?: number;
}

export interface GuestSearchResult {
  guests: Guest[];
  total: number;
  hasMore: boolean;
}
