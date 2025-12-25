import type { Guest } from "@/types/guestTypes";
import { parseCSV, isValidEmail, normalizePhone, calculateSimilarity } from "./csvHelpers";
import { COMMON_HEADER_MAPPINGS } from "./csvHelpers";

export interface GuestParseResult {
  guests: Partial<Guest>[];
  errors: string[];
  warnings: string[];
}

/**
 * Parse guest CSV file with appropriate header mappings
 */
export function parseGuestCSV(file: File): Promise<GuestParseResult> {
  return parseCSV<Partial<Guest>>(
    file,
    (row: any, index: number) => {
      const guest: Partial<Guest> = {
        fullName: row.fullName?.trim(),
        email: row.email?.trim().toLowerCase(),
        phone: row.phone?.trim(),
        accommodations: row.accommodations?.trim(),
        bookingId: row.bookingId ? parseInt(row.bookingId, 10) : undefined,
        bookingCode: row.bookingCode?.trim(),
      };

      // Validation
      if (!guest.fullName) {
        throw new Error(`Missing name in row ${index + 2}`);
      }

      if (guest.bookingId && isNaN(guest.bookingId)) {
        guest.bookingId = undefined;
      }

      return guest;
    },
    COMMON_HEADER_MAPPINGS.guest
  ).then((result) => ({
    guests: result.data,
    errors: result.errors.map(e => e.reason),
    warnings: result.warnings,
  }));
}

/**
 * Find potential duplicates based on multiple criteria
 */
export async function findGuestDuplicates(
  guest: Partial<Guest>,
  existingGuests: Guest[]
): Promise<Array<{ existing: Guest; confidence: number; matchType: string }>> {
  const matches: Array<{ existing: Guest; confidence: number; matchType: string }> = [];

  // Exact booking ID match
  if (guest.bookingId) {
    const bookingMatches = existingGuests.filter(g => g.bookingId === guest.bookingId);
    for (const existing of bookingMatches) {
      matches.push({
        existing,
        confidence: 1.0,
        matchType: "booking_id",
      });
    }
  }

  // Email match
  if (guest.email) {
    const emailMatches = existingGuests.filter(g => 
      g.email?.toLowerCase() === guest.email?.toLowerCase()
    );
    for (const existing of emailMatches) {
      if (!matches.find(m => m.existing.id === existing.id)) {
        matches.push({
          existing,
          confidence: 0.9,
          matchType: "email",
        });
      }
    }
  }

  // Phone match (if available)
  if (guest.phone) {
    const normalizedPhone = normalizePhone(guest.phone);
    const phoneMatches = existingGuests.filter(g => 
      g.phone && normalizePhone(g.phone) === normalizedPhone
    );
    for (const existing of phoneMatches) {
      if (!matches.find(m => m.existing.id === existing.id)) {
        matches.push({
          existing,
          confidence: 0.85,
          matchType: "phone",
        });
      }
    }
  }

  // Fuzzy name match
  if (guest.fullName) {
    for (const existing of existingGuests) {
      if (matches.find(m => m.existing.id === existing.id)) continue;

      const similarity = calculateSimilarity(guest.fullName, existing.fullName);
      if (similarity > 0.8) {
        matches.push({
          existing,
          confidence: similarity,
          matchType: "fuzzy_name",
        });
      }
    }
  }

  return matches.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Get conflicting fields between two guests
 */
export function getGuestConflicts(existing: Guest, newGuest: Partial<Guest>): string[] {
  const conflicts: string[] = [];
  const fieldsToCheck = [
    "fullName",
    "email",
    "phone",
    "accommodations",
    "bookingId",
  ];

  for (const field of fieldsToCheck) {
    const existingVal = existing[field as keyof Guest];
    const newVal = newGuest[field as keyof Guest];

    if (newVal && existingVal && existingVal !== newVal) {
      conflicts.push(field);
    }
  }

  return conflicts;
}
