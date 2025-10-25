"use client";

import { useMemo } from "react";
import type { Asset, MaintenanceLog } from "@/types/maintenance";
import { computeAssetStatus } from "./useAssetStatus";

export interface Summary {
  totalAssets: number;
  logsThisMonth: number;
  overdue: number;
  dueSoon: number;
}

export function useMaintenanceSummary(assets: Asset[], logs: MaintenanceLog[]): Summary {
  return useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const logsThisMonth = logs.filter((l) => l.date >= monthStart).length;

    let overdue = 0;
    let dueSoon = 0;
    for (const a of assets) {
      const s = computeAssetStatus(a).status;
      if (s === "Overdue") overdue += 1;
      else if (s === "Due Soon") dueSoon += 1;
    }

    return {
      totalAssets: assets.length,
      logsThisMonth,
      overdue,
      dueSoon,
    };
  }, [assets, logs]);
}