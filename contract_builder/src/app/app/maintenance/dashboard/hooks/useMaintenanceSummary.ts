"use client";

import { useMemo } from "react";
import type { Asset, MaintenanceLog } from "@/app/app/maintenance/_types";
import { getAssetStatus } from "@/app/app/maintenance/_lib/maintenanceSelectors";

export interface Summary {
  totalAssets: number;
  overdue: number;
  dueSoon: number;
  ok: number;
  logsThisMonth: number; // renamed to match SummaryCards
}

export function useMaintenanceSummary(assets: Asset[], logs: MaintenanceLog[]): Summary {
  return useMemo(() => {
    let overdue = 0;
    let dueSoon = 0;
    let ok = 0;

    for (const a of assets) {
      const s = getAssetStatus(a);
      if (s === "Overdue") overdue++;
      else if (s === "Due Soon") dueSoon++;
      else ok++;
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const logsThisMonth = logs.filter((l) => l.date && l.date >= startOfMonth).length;

    return {
      totalAssets: assets.length,
      overdue,
      dueSoon,
      ok,
      logsThisMonth,
    };
  }, [assets, logs]);
}