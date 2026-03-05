import type { Asset } from "@/types/maintenance";

export type AssetStatus = "Overdue" | "Due Soon" | "OK";

export function computeAssetStatus(asset: Asset): { status: AssetStatus; colorScheme: "red" | "orange" | "green" } {
  const hours = asset.hours ?? 0;
  const nextDue = asset.nextServiceDue ?? Number.POSITIVE_INFINITY;

  if (Number.isFinite(nextDue) && hours >= nextDue) {
    return { status: "Overdue", colorScheme: "red" };
  }
  if (Number.isFinite(nextDue) && hours >= nextDue * 0.9) {
    return { status: "Due Soon", colorScheme: "orange" };
  }
  return { status: "OK", colorScheme: "green" };
}