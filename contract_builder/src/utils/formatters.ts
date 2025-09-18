export function formatFocRule(rule?: string): string {
  if (!rule) return 'Not set'
  const [paid, free] = rule.split('+')
  if (!paid || !free) return rule
  return `${paid} paid, ${free} free`
}

export function parseFocRule(rule: string): { paid: number; free: number } {
  const [paid, free] = rule.split("+").map(Number)
  return { paid: paid!, free: free! }
}

function parseDateOnly(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number)
  return new Date(year, month - 1, day) // Local midnight, no UTC shift
}

export function formatDate(date: string | Date): string {
  let d: Date

  if (typeof date === "string") {
    const [year, month, day] = date.split("-").map(Number)
    d = new Date(year, month - 1, day) // 👈 month is 0-based
  } else {
    d = date
  }

  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  }
  return d.toLocaleDateString(undefined, options)
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

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "-"
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}
