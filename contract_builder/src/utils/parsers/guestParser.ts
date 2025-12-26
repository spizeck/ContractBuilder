import type { Guest } from "@/types/guestTypes";
import { parseCSV, isValidEmail, normalizePhone, calculateSimilarity } from "./csvHelpers";
import { COMMON_HEADER_MAPPINGS } from "./csvHelpers";

export interface GuestParseResult {
  guests: Partial<Guest>[];
  errors: string[];
  warnings: string[];
  bookingGroups: Map<string, Partial<Guest>[]>; // Group by booking code
}

/**
 * Parse guest CSV file with appropriate header mappings
 */
export function parseGuestCSV(file: File): Promise<GuestParseResult> {
  return parseCSV<Partial<Guest>>(
    file,
    (row: any, index: number) => {
      // After header mapping and normalization, use the actual field names
      const guest: Partial<Guest> = {
        fullName: row.fullname?.trim(),
        email: row.email?.trim().toLowerCase(),
        phone: row.phone?.trim(),
        accommodations: row.accommodations?.trim(),
        bookingId: row.bookingid ? parseInt(row.bookingid, 10) : undefined,
        bookingCode: row.bookingcode?.trim(),
        
        // Required fields
        source: 'waiver_import',
        dataPriority: 'medium',
        duplicateStatus: 'clean',
        
        // Dive-specific fields
        certificationLevel: row.certificationlevel?.trim(),
        certificationAgency: row.certificationagency?.trim(),
        nitroxCertified: row['diving nitrox (at additional cost)']?.toLowerCase().includes('yes'),
        lastDiveDate: row.lastdivedate?.trim(),
        totalDives: row.totaldives ? parseInt(row.totaldives, 10) : undefined,
        specialRequirements: row.specialrequirements?.trim(),
        
        // Travel details
        arrivalDate: row['arrival date']?.trim(),
        arrivalDetails: row['arrival details (flight or ferry time)']?.trim(),
        departureDate: row['departure date']?.trim(),
        departureDetails: row.departuredetails?.trim(),
        
        // Equipment needs
        equipment: {
          bcd: {
            needed: row.bcd?.toLowerCase().includes('rental'),
            size: row.bcd?.match(/–\s*(.+)$/)?.[1]?.trim(),
            abbreviation: row.bcd?.toLowerCase().includes('own') ? 'OWN' : 
                         row.bcd?.match(/–\s*(.+)$/)?.[1]?.trim() ? `R-${row.bcd.match(/–\s*(.+)$/)?.[1]?.trim()}` : 'N/A'
          },
          regulator: {
            needed: row.regulator?.toLowerCase().includes('rental'),
            size: row.regulator?.match(/–\s*(.+)$/)?.[1]?.trim(),
            abbreviation: row.regulator?.toLowerCase().includes('own') ? 'OWN' : 'RENTAL'
          },
          wetsuit: {
            needed: row['wetsuit (not mandatory)']?.toLowerCase().includes('rental'),
            size: row['wetsuit (not mandatory)']?.match(/–\s*(.+)$/)?.[1]?.trim(),
            abbreviation: row['wetsuit (not mandatory)']?.toLowerCase().includes('own') ? 'OWN' : 'N/A'
          },
          fins: {
            needed: row.fins?.toLowerCase().includes('rental'),
            size: row.fins?.match(/–\s*(.+)$/)?.[1]?.trim(),
            abbreviation: row.fins?.toLowerCase().includes('own') ? 'OWN' : 'RENTAL'
          },
          mask: {
            needed: row.mask?.toLowerCase().includes('rental'),
            abbreviation: row.mask?.toLowerCase().includes('own') ? 'OWN' : 'RENTAL'
          },
          computer: {
            needed: row['dive computer (required)']?.toLowerCase().includes('rental'),
            abbreviation: row['dive computer (required)']?.toLowerCase().includes('own') ? 'OWN' : 'RENTAL'
          }
        },
        
        // Waiver metadata
        waiverDocumentId: row.document?.trim(),
        waiverStatus: row.status as 'COMPLETE' | 'INCOMPLETE',
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
    {
      // Header mappings - map original headers to normalized names
      'name': 'fullname',
      'full name': 'fullname',
      'full name_1': 'fullname', // Handle duplicate columns
      'primary email': 'email',
      'email address': 'email',
      'email_1': 'email',
      'phone number': 'phone',
      'accomodations': 'accommodations',
      'accommodation details': 'accommodations',
      'accommodations_1': 'accommodations',
      'booking': 'bookingcode',
      'booking code': 'bookingcode',
      'certification level': 'certificationlevel',
      'certification agency and number': 'certificationagency',
      'date of last dive': 'lastdivedate',
      'number of dives in your lifetime': 'totaldives',
      'is there anything else you would like for us to know?': 'specialrequirements',
      'are you a comfortable swimmer? anything else we need to know?': 'specialrequirements',
      'participants name': 'fullname',
      'participant name': 'fullname',
      'departure details': 'departuredetails',
    }
  ).then((result) => {
    console.log('Parser result:', result);
    
    // Group by booking code
    const bookingGroups = new Map<string, Partial<Guest>[]>();
    
    result.data.forEach(guest => {
      if (guest.bookingCode) {
        if (!bookingGroups.has(guest.bookingCode)) {
          bookingGroups.set(guest.bookingCode, []);
        }
        bookingGroups.get(guest.bookingCode)!.push(guest);
      }
    });
    
    console.log('Booking groups created:', bookingGroups.size);
    
    return {
      guests: result.data,
      errors: result.errors.map(e => e.reason),
      warnings: result.warnings,
      bookingGroups,
    };
  });
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
