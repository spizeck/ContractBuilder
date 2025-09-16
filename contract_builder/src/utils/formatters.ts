export function formatFocRule(rule?: string): string {
  if (!rule) return 'Not set'
  const [paid, free] = rule.split('+')
  if (!paid || !free) return rule
  return `${paid} paid, ${free} free`
}

function parseDateOnly(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number)
  return new Date(year, month - 1, day) // Local midnight, no UTC shift
}
export function formatDateRange(start: string, end: string): string {
  const format = (dateStr: string) => {
    const date = parseDateOnly(dateStr)

    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
    const formatted = date.toLocaleDateString(undefined, options)

    // Add ordinal suffix
    const dayNum = date.getDate()
    const suffix =
      dayNum % 10 === 1 && dayNum !== 11
        ? "st"
        : dayNum % 10 === 2 && dayNum !== 12
        ? "nd"
        : dayNum % 10 === 3 && dayNum !== 13
        ? "rd"
        : "th"

    return formatted.replace(/\d+/, `${dayNum}${suffix}`)
  }

  return `${format(start)} to ${format(end)}`
}
