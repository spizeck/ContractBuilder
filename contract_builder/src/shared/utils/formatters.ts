export function formatFocRule(rule?: string): string {
  if (!rule) return "Not set";
  const [paid, free] = rule.split("+");
  if (!paid || !free) return rule;
  return `${paid} paid, ${free} free`;
}

export function parseFocRule(rule?: string): { paid: number; free: number } {
  if (!rule) return { paid: 0, free: 0 };

  // Trim and split by "+"
  const parts = rule.split("+").map((p) => p.trim());

  // Parse both sides safely
  const paid = parts[0] ? parseInt(parts[0], 10) : 0;
  const free = parts[1] ? parseInt(parts[1], 10) : 0;

  // Guard against NaN results
  return {
    paid: isNaN(paid) ? 0 : paid,
    free: isNaN(free) ? 0 : free,
  };
}

export function parseDateOnly(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day); // Local midnight, no UTC shift
}

export function formatDate(date: string | Date | { toDate(): Date } | null | undefined): string {
  if (!date) return "-";

  let d: Date;

  if (typeof date === "string") {
    const [year, month, day] = date.split("-").map(Number);
    d = new Date(year, month - 1, day); // 👈 month is 0-based
  } else if (date instanceof Date) {
    d = date;
  } else if (typeof date === "object" && "toDate" in date && typeof date.toDate === "function") {
    // Handle Firebase Timestamp
    d = date.toDate();
  } else {
    return "-";
  }

  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return d.toLocaleDateString(undefined, options);
}

export function formatDateRange(start: string, end: string): string {
  const format = (dateStr: string) => {
    const date = parseDateOnly(dateStr);

    const dayNum = date.getDate();
    const suffix =
      dayNum % 10 === 1 && dayNum !== 11
        ? "st"
        : dayNum % 10 === 2 && dayNum !== 12
        ? "nd"
        : dayNum % 10 === 3 && dayNum !== 13
        ? "rd"
        : "th";

    const month = date.toLocaleDateString(undefined, { month: "long" });
    const year = date.getFullYear();

    return `${month} ${dayNum}${suffix}, ${year}`;
  };

  return `${format(start)} to ${format(end)}`;
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "-";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

// Helper function to format date for input without timezone shift
export function toInputDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatNumber(value: number | null | undefined, decimals = 0): string {
  if (value == null) return "-";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
