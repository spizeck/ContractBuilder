import Papa from "papaparse";

export interface CSVParseError {
  row: number;
  field: string;
  value: string;
  reason: string;
  suggestion?: string;
}

export interface CSVParseResult<T> {
  data: T[];
  errors: CSVParseError[];
  warnings: string[];
}

/**
 * Common CSV parsing options used across the application
 */
export const DEFAULT_CSV_PARSE_CONFIG: Papa.ParseConfig = {
  header: true,
  skipEmptyLines: true,
  transformHeader: (header: string) => {
    // Normalize headers to lowercase and trim
    return header.toLowerCase().trim();
  },
};

/**
 * Generic CSV parser with error handling
 */
export function parseCSV<T>(
  file: File,
  transformRow?: (row: any, index: number) => T | null,
  headerMapping?: Record<string, string>
): Promise<CSVParseResult<T>> {
  return new Promise((resolve) => {
    const config = { ...DEFAULT_CSV_PARSE_CONFIG };

    // Apply header mapping if provided
    if (headerMapping) {
      config.transformHeader = (header: string) => {
        const normalized = header.toLowerCase().trim();
        return headerMapping[normalized] || normalized;
      };
    }

    Papa.parse(file, {
      ...config,
      complete: (results) => {
        const data: T[] = [];
        const errors: CSVParseError[] = [];
        const warnings: string[] = [];

        results.data.forEach((row: any, index: number) => {
          try {
            if (transformRow) {
              const transformed = transformRow(row, index);
              if (transformed) {
                data.push(transformed);
              }
            } else {
              data.push(row as T);
            }
          } catch (error) {
            errors.push({
              row: index + 2, // +2 because header is row 1 and we're 0-indexed
              field: "unknown",
              value: JSON.stringify(row),
              reason: error instanceof Error ? error.message : "Unknown error",
            });
          }
        });

        resolve({ data, errors, warnings });
      },
      error: (error) => {
        resolve({
          data: [],
          errors: [{
            row: 0,
            field: "parse",
            value: "",
            reason: `Parse error: ${error.message}`,
          }],
          warnings: [],
        });
      },
    });
  });
}

/**
 * Helper to get the first non-empty value from multiple possible keys
 */
export function getFirstValue(
  row: Record<string, any>,
  keys: string[]
): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

/**
 * Email validation helper
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Phone number normalization
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Email normalization
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Calculate string similarity using Levenshtein distance
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const a = str1.toLowerCase().trim();
  const b = str2.toLowerCase().trim();

  if (a === b) return 1.0;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  const distance = matrix[b.length][a.length];
  const maxLen = Math.max(a.length, b.length);
  return 1 - distance / maxLen;
}

/**
 * Common header mappings for different CSV types
 */
export const COMMON_HEADER_MAPPINGS = {
  // Guest/Contact headers
  guest: {
    "full name": "fullName",
    name: "fullName",
    "email address": "email",
    "phone number": "phone",
    hotel: "accommodations",
    accommodation: "accommodations",
    "booking id": "bookingId",
    booking_id: "bookingId",
    "booking code": "bookingCode",
  },
  // Equipment headers (Checkfront-specific)
  equipment: {
    bcd: "BCD",
    regulator: "Regulator",
    mask: "Mask",
    fins: "Fins",
    "wetsuit (not mandatory)": "Wetsuit",
    "dive computer (required)": "Computer",
  },
} as const;
