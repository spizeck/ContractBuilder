import { parseDate, parseDateStringAsUTC, parseDateOnly } from './parsers';

/**
 * Format date and time in local timezone
 * Example: "12/25/2024 at 2:30:00 PM"
 */
export function formatDateTime(dateVal: any): string {
  const date = parseDate(dateVal);
  if (isNaN(date.getTime())) return 'Invalid date';
  
  return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
}

/**
 * Format date for dive logs with UTC timezone
 * Example: "Dec 25, 2024"
 */
export function formatDiveDate(value: any): string {
  if (!value) return '—';

  const date =
    value instanceof Date
      ? value
      : value?.seconds
      ? new Date(value.seconds * 1000)
      : new Date(value);

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Format date in long format
 * Example: "December 25, 2024"
 */
export function formatDate(date: string | Date): string {
  let d: Date;

  if (typeof date === "string") {
    d = parseDateOnly(date);
  } else {
    d = date;
  }

  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return d.toLocaleDateString(undefined, options);
}

/**
 * Format date range with ordinal suffixes
 * Example: "December 25th to December 31st, 2024"
 */
export function formatDateRange(start: string, end: string): string {
  const format = (dateStr: string) => {
    const date = parseDateOnly(dateStr);

    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const formatted = date.toLocaleDateString(undefined, options);

    // Add ordinal suffix
    const dayNum = date.getDate();
    const suffix =
      dayNum % 10 === 1 && dayNum !== 11
        ? "st"
        : dayNum % 10 === 2 && dayNum !== 12
        ? "nd"
        : dayNum % 10 === 3 && dayNum !== 13
        ? "rd"
        : "th";

    return formatted.replace(/\d+/, `${dayNum}${suffix}`);
  };

  return `${format(start)} to ${format(end)}`;
}

/**
 * Format date for HTML input (YYYY-MM-DD)
 * No timezone shift
 */
export function toInputDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date in short format
 * Example: "12/25/2024"
 */
export function formatShortDate(dateVal: any): string {
  const date = parseDate(dateVal);
  if (isNaN(date.getTime())) return 'Invalid date';
  
  return date.toLocaleDateString();
}

/**
 * Format date with time in short format
 * Example: "12/25/2024, 2:30 PM"
 */
export function formatShortDateTime(dateVal: any): string {
  const date = parseDate(dateVal);
  if (isNaN(date.getTime())) return 'Invalid date';
  
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Format time only
 * Example: "2:30 PM"
 */
export function formatTime(dateVal: any): string {
  const date = parseDate(dateVal);
  if (isNaN(date.getTime())) return 'Invalid date';
  
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(dateVal: any): string {
  const date = parseDate(dateVal);
  if (isNaN(date.getTime())) return 'Invalid date';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.round(diffMs / 1000);
  const diffMinutes = Math.round(diffSeconds / 60);
  const diffHours = Math.round(diffMinutes / 60);
  const diffDays = Math.round(diffHours / 24);

  if (Math.abs(diffSeconds) < 60) {
    return diffSeconds < 0 ? 'in a few seconds' : 'a few seconds ago';
  }
  
  if (Math.abs(diffMinutes) < 60) {
    return diffMinutes < 0 ? `in ${Math.abs(diffMinutes)} minutes` : `${diffMinutes} minutes ago`;
  }
  
  if (Math.abs(diffHours) < 24) {
    return diffHours < 0 ? `in ${Math.abs(diffHours)} hours` : `${diffHours} hours ago`;
  }
  
  if (Math.abs(diffDays) < 7) {
    return diffDays < 0 ? `in ${Math.abs(diffDays)} days` : `${diffDays} days ago`;
  }
  
  // For older dates, return the actual date
  return formatDate(date);
}

/**
 * Format ISO date string (YYYY-MM-DD)
 */
export function toISODate(dateVal: any): string {
  const date = parseDate(dateVal);
  if (isNaN(date.getTime())) return '';
  
  return date.toISOString().split('T')[0];
}

/**
 * Format date with weekday
 * Example: "Wednesday, December 25, 2024"
 */
export function formatDateWithWeekday(dateVal: any): string {
  const date = parseDate(dateVal);
  if (isNaN(date.getTime())) return 'Invalid date';
  
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
