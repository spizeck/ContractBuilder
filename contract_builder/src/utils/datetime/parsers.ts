import { Timestamp } from 'firebase/firestore';

/**
 * Parse any date value into a Date object
 * Handles Firebase Timestamps, Date objects, timestamp objects, and strings
 */
export function parseDate(dateVal: any): Date {
  if (!dateVal) return new Date(NaN);

  if (dateVal instanceof Timestamp) {
    return dateVal.toDate();
  }

  if (dateVal instanceof Date) {
    return dateVal;
  }

  if (
    typeof dateVal === 'object' &&
    typeof dateVal.seconds === 'number' &&
    typeof dateVal.nanoseconds === 'number'
  ) {
    return new Date(dateVal.seconds * 1000);
  }

  const parsed = new Date(dateVal);
  return isNaN(parsed.getTime()) ? new Date(NaN) : parsed;
}

/**
 * Parse a date string in YYYY-MM-DD format as UTC
 * Useful for date-only values that should not be timezone-shifted
 */
export function parseDateStringAsUTC(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Parse a date string as local time (no timezone shift)
 * Used for date-only inputs that should remain in local timezone
 */
export function parseDateOnly(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day); // Local midnight, no UTC shift
}

/**
 * Check if a date value is valid
 */
export function isValidDate(dateVal: any): boolean {
  const date = parseDate(dateVal);
  return !isNaN(date.getTime());
}

/**
 * Check if a date is today (in local timezone)
 */
export function isToday(dateVal: any): boolean {
  const date = parseDate(dateVal);
  if (isNaN(date.getTime())) return false;
  
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

/**
 * Check if a date is in the past (in local timezone)
 */
export function isPast(dateVal: any): boolean {
  const date = parseDate(dateVal);
  if (isNaN(date.getTime())) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

/**
 * Check if a date is in the future (in local timezone)
 */
export function isFuture(dateVal: any): boolean {
  const date = parseDate(dateVal);
  if (isNaN(date.getTime())) return false;
  
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return date > today;
}
