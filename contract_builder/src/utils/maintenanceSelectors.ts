// Small helpers so UI can stay simple (and typed)

import { Asset, isDateTracked, isHoursTracked, isKmTracked } from "@/types/maintenance";

export function getTrackingLabel(a: Asset): "None" | "Hours" | "Kilometers" | "Date" {
  if (isHoursTracked(a)) return "Hours";
  if (isKmTracked(a)) return "Kilometers";
  if (isDateTracked(a)) return "Date";
  return "None";
}

export function getCurrentReading(a: Asset): number | undefined {
  if (isHoursTracked(a)) return a.currentHours;
  if (isKmTracked(a)) return a.currentKilometers;
  return undefined;
}

// Human-readable “next due” for table display
export function getNextDueDisplay(a: Asset): string {
  if (isHoursTracked(a)) return a.nextServiceDueHours != null ? String(a.nextServiceDueHours) : "-";
  if (isKmTracked(a)) return a.nextServiceDueKilometers != null ? String(a.nextServiceDueKilometers) : "-";
  if (isDateTracked(a)) {
    return a.nextServiceDueDate ? new Date(a.nextServiceDueDate).toLocaleDateString() : "-";
  }
  return "-";
}