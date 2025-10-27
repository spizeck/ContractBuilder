// Small helpers so UI can stay simple (and typed)

import type { Asset } from "@/types/maintenance";

export type StatusColor = "red" | "orange" | "green" | "gray";

export function getTrackingLabel(a: Asset): "None" | "Hours" | "Kilometers" | "Date" {
  if (a.serviceTracking === "hours") return "Hours";
  if (a.serviceTracking === "kilometers") return "Kilometers";
  if (a.serviceTracking === "date") return "Date";
  return "None";
}

export function getCurrentReading(a: Asset): number | undefined {
  if (a.serviceTracking === "hours") return a.currentHours;
  if (a.serviceTracking === "kilometers") return a.currentKilometers;
  return undefined;
}

// Human-readable “next due” for table display
export function getNextDueDisplay(a: Asset): string {
  if (a.serviceTracking === "hours") return a.nextServiceDueHours != null ? String(a.nextServiceDueHours) : "-";
  if (a.serviceTracking === "kilometers") return a.nextServiceDueKilometers != null ? String(a.nextServiceDueKilometers) : "-";
  if (a.serviceTracking === "date") return a.nextServiceDueDate ? new Date(a.nextServiceDueDate).toLocaleDateString() : "-";
  return "-";
}

export function getAssetStatus(a: Asset): "Overdue" | "Due Soon" | "OK" {
  const today = new Date();

  if (a.serviceTracking === "hours") {
    const cur = a.currentHours ?? 0;
    const next = a.nextServiceDueHours;
    const interval = a.serviceIntervalHours;
    if (next == null) return "OK";
    if (cur >= next) return "Overdue";
    if (interval && next - cur <= Math.max(interval * 0.1, 1)) return "Due Soon";
    return "OK";
  }
  if (a.serviceTracking === "kilometers") {
    const cur = a.currentKilometers ?? 0;
    const next = a.nextServiceDueKilometers;
    const interval = a.serviceIntervalKilometers;
    if (next == null) return "OK";
    if (cur >= next) return "Overdue";
    if (interval && next - cur <= Math.max(interval * 0.1, 1)) return "Due Soon";
    return "OK";
  }
  if (a.serviceTracking === "date") {
    const next = a.nextServiceDueDate;
    if (!next) return "OK";
    const nextMid = new Date(next.getFullYear(), next.getMonth(), next.getDate());
    const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (nextMid < todayMid) return "Overdue";
    const diffDays = Math.ceil((nextMid.getTime() - todayMid.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDays <= 14) return "Due Soon";
    return "OK";
  }
  return "OK";
}

export function getStatusColor(status: "Overdue" | "Due Soon" | "OK"): StatusColor {
  if (status === "Overdue") return "red";
  if (status === "Due Soon") return "orange";
  return "green";
}