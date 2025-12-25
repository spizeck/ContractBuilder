/**
 * Timezone constants
 */
export const TIMEZONES = {
  UTC: 'UTC',
  LOCAL: 'local',
  // Common timezones for the application
  EASTERN: 'America/New_York',
  CENTRAL: 'America/Chicago',
  MOUNTAIN: 'America/Denver',
  PACIFIC: 'America/Los_Angeles',
} as const;

/**
 * Date format constants for Intl.DateTimeFormat
 */
export const DATE_FORMATS = {
  // Short formats
  SHORT_DATE: { year: 'numeric', month: '2-digit', day: '2-digit' } as const,
  SHORT_MONTH: { month: 'short' } as const,
  
  // Long formats
  LONG_DATE: { year: 'numeric', month: 'long', day: 'numeric' } as const,
  LONG_DATE_WITH_WEEKDAY: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' } as const,
  
  // Time formats
  SHORT_TIME: { hour: 'numeric', minute: '2-digit', hour12: true } as const,
  LONG_TIME: { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true } as const,
  
  // Combined formats
  SHORT_DATETIME: { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true 
  } as const,
  
  LONG_DATETIME: { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true 
  } as const,
} as const;

/**
 * Dive-specific date formats
 */
export const DIVE_DATE_FORMATS = {
  // Format for dive logs (UTC)
  DIVE_LOG: { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    timeZone: 'UTC'
  } as const,
  
  // Format for dive schedules (local)
  DIVE_SCHEDULE: { 
    weekday: 'short',
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  } as const,
} as const;

/**
 * Relative time thresholds (in milliseconds)
 */
export const RELATIVE_TIME_THRESHOLDS = {
  SECONDS: 60 * 1000,
  MINUTES: 60 * 60 * 1000,
  HOURS: 24 * 60 * 60 * 1000,
  DAYS: 7 * 24 * 60 * 60 * 1000,
} as const;

/**
 * Date validation patterns
 */
export const DATE_PATTERNS = {
  // YYYY-MM-DD
  ISO_DATE: /^\d{4}-\d{2}-\d{2}$/,
  
  // MM/DD/YYYY
  US_DATE: /^\d{2}\/\d{2}\/\d{4}$/,
  
  // DD/MM/YYYY
  EU_DATE: /^\d{2}\/\d{2}\/\d{4}$/,
  
  // ISO datetime
  ISO_DATETIME: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
} as const;

/**
 * Common date formats for parsing
 */
export const COMMON_DATE_FORMATS = [
  'YYYY-MM-DD',
  'MM/DD/YYYY',
  'DD/MM/YYYY',
  'MM-DD-YYYY',
  'DD-MM-YYYY',
  'YYYY/MM/DD',
  'YYYY/MM/DD HH:mm:ss',
  'YYYY-MM-DDTHH:mm:ss',
] as const;
