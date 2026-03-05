export function parseDateStringAsUTC(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    throw new Error(`Invalid date string: "${dateString}". Expected format: YYYY-MM-DD`)
  }
  return new Date(Date.UTC(year, month - 1, day))
}


export function formatDiveDate(value: any): string {
  if (!value) return '—'

  const date =
    value instanceof Date
      ? value
      : value?.seconds
      ? new Date(value.seconds * 1000)
      : new Date(value)

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}
