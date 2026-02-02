import type { Customer } from "@/types/manifestTypes";
import { calculateSimilarity, normalizeEmail, normalizePhone } from "./csvHelpers";

export interface BatchImportResult {
  created: number;
  updated: number;
  duplicates: number;
}

export interface CustomerWithCsvDate extends Omit<Customer, "id" | "createdAt" | "updatedAt"> {
  csvCreatedDate?: string;
}

/**
 * Find duplicate customers based on multiple criteria
 */
export function findDuplicateCustomers(
  newCustomer: CustomerWithCsvDate,
  existingCustomers: Customer[]
): Customer | null {
  // Priority 1: Exact email match
  if (newCustomer.emailLower) {
    const emailMatch = existingCustomers.find(
      (c) => c.emailLower && normalizeEmail(c.emailLower) === normalizeEmail(newCustomer.emailLower!)
    );
    if (emailMatch) {
      return emailMatch;
    }
  }

  // Priority 2: Exact phone match
  if (newCustomer.phoneE164) {
    const phoneMatch = existingCustomers.find(
      (c) => c.phoneE164 && normalizePhone(c.phoneE164) === normalizePhone(newCustomer.phoneE164!)
    );
    if (phoneMatch) {
      return phoneMatch;
    }
  }

  // Priority 3: High similarity name + email/phone match
  const nameMatches = existingCustomers.filter((c) => {
    const similarity = calculateSimilarity(
      newCustomer.fullName || "",
      c.fullName || ""
    );
    return similarity > 0.85;
  });

  for (const match of nameMatches) {
    // Check if email or phone also matches
    const emailMatches =
      newCustomer.emailLower &&
      match.emailLower &&
      normalizeEmail(newCustomer.emailLower) === normalizeEmail(match.emailLower);
    const phoneMatches =
      newCustomer.phoneE164 &&
      match.phoneE164 &&
      normalizePhone(newCustomer.phoneE164) === normalizePhone(match.phoneE164);

    if (emailMatches || phoneMatches) {
      return match;
    }
  }

  // Priority 4: High similarity name match
  if (nameMatches.length > 0) {
    return nameMatches[0];
  }

  return null;
}

/**
 * Determine if a new customer should update an existing one
 */
export function shouldUpdateCustomer(
  newCustomer: CustomerWithCsvDate,
  existingCustomer: Customer
): boolean {
  // If new customer has CSV created date and existing doesn't, update
  if (newCustomer.csvCreatedDate && !existingCustomer.createdAt) {
    return true;
  }

  // If both have CSV dates, update if new is more recent
  if (
    newCustomer.csvCreatedDate &&
    existingCustomer.createdAt &&
    new Date(newCustomer.csvCreatedDate) > existingCustomer.createdAt
  ) {
    return true;
  }

  // If existing has no created date, update
  if (!existingCustomer.createdAt) {
    return true;
  }

  // Default: don't update (treat as duplicate)
  return false;
}

/**
 * Process batch import with duplicate prevention
 */
export async function processBatchImport(
  newCustomers: CustomerWithCsvDate[],
  existingCustomers: Customer[],
  onUpdate: (id: string, data: Partial<Customer>) => Promise<void>,
  onCreate: (data: Omit<Customer, "id" | "createdAt" | "updatedAt">) => Promise<string>
): Promise<BatchImportResult> {
  let created = 0;
  let updated = 0;
  let duplicates = 0;

  for (const newCustomer of newCustomers) {
    const duplicate = findDuplicateCustomers(newCustomer, existingCustomers);

    if (!duplicate) {
      // Create new customer
      const { csvCreatedDate, ...customerData } = newCustomer;
      await onCreate(customerData);
      created++;
    } else {
      // Check if we should update
      if (shouldUpdateCustomer(newCustomer, duplicate)) {
        const { csvCreatedDate, ...updateData } = newCustomer;
        await onUpdate(duplicate.id, updateData);
        updated++;
      } else {
        duplicates++;
      }
    }
  }

  return {
    created,
    updated,
    duplicates,
  };
}
