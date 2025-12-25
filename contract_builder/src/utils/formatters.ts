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

export function formatNumber(value: number | null | undefined, decimals = 0): string {
  if (value == null) return "-";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
