import { Timestamp } from 'firebase/firestore'

export function parseDate(dateVal: any): Date {
  if (!dateVal) return new Date(NaN)

  if (dateVal instanceof Timestamp) {
    return dateVal.toDate()
  }

  if (dateVal instanceof Date) {
    return dateVal
  }

  if (
    typeof dateVal === 'object' &&
    typeof dateVal.seconds === 'number' &&
    typeof dateVal.nanoseconds === 'number'
  ) {
    return new Date(dateVal.seconds * 1000)
  }

  const parsed = new Date(dateVal)
  return isNaN(parsed.getTime()) ? new Date(NaN) : parsed
}

export function formatDateTime(dateVal: any): string {
  const date = parseDate(dateVal)
  if (isNaN(date.getTime())) return 'Invalid date'
  
  return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`
}
