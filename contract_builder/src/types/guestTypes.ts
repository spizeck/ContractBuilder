import type { Timestamp } from "firebase/firestore";

export interface Guest {
  id: string; // Firestore doc ID
  fullName: string;
  email?: string;
  phone?: string;
  accommodations?: string; // Pickup location
  bookingId?: number; // From waiver CSV
  bookingCode?: string; // Human-readable reference

  // Metadata
  source: "waiver_import" | "manual" | "checkfront";
  importBatchId?: string; // Track which CSV import
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string; // User ID

  // Reconciliation flags
  matchStatus?: "matched" | "unmatched" | "duplicate" | "needs_review";
  matchNotes?: string;

  // Additional dive-specific info
  certificationLevel?: string;
  emergencyContact?: string;
  medicalNotes?: string;
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
  conflicts: string[]; // Fields that differ
}
