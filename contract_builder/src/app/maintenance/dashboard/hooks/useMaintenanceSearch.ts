"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Asset, Technician, MaintenanceLog } from "@/types/maintenance";

type Category = "All" | "Marine" | "Compressors" | "Vehicles" | "Scuba Equipment" | "Other";

export function useMaintenanceData(params: {
  keyword: string;
  category: Category;
  technicianId: string | "All";
  range: { start: Date | null; end: Date | null };
}): {
  assets: Asset[];
  logs: MaintenanceLog[];
  technicians: Technician[];
  loading: boolean;
} {
  const { keyword, category, technicianId, range } = params;

  const [assets, setAssets] = useState<Asset[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Assets (avoid composite index by removing orderBy; sort client-side)
  useEffect(() => {
    const constraints: QueryConstraint[] = [];
    // if you need only active assets, add: constraints.push(where("active", "==", true));
    const qRef = query(collection(db, "assets"), ...constraints);
    const unsub = onSnapshot(
      qRef,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Asset[];
        console.log('Dashboard loaded assets:', items.length, items.map(a => ({ id: a.id, name: a.name, category: a.category, active: a.active })));
        // Client-side sort by name for stable UI without composite index
        setAssets(
          items.sort((a, b) => (a.name || "").localeCompare(b.name || ""))
        );
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  // Technicians (same approach)
  useEffect(() => {
    const constraints: QueryConstraint[] = [];
    // if you need only active techs, add: constraints.push(where("active", "==", true));
    const qRef = query(collection(db, "technicians"), ...constraints);
    const unsub = onSnapshot(
      qRef,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Technician[];
        setTechnicians(
          items.sort((a, b) => (a.name || "").localeCompare(b.name || ""))
        );
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  // Logs: range filter on date is supported with orderBy('date')
  useEffect(() => {
    const constraints: QueryConstraint[] = [orderBy("date", "desc")];
    if (range.start) constraints.push(where("date", ">=", Timestamp.fromDate(range.start)));
    if (range.end) constraints.push(where("date", "<=", Timestamp.fromDate(range.end)));
    const qRef = query(collection(db, "maintenanceLogs"), ...constraints);

    const unsub = onSnapshot(
      qRef,
      (snap) => {
        const items = snap.docs.map((d) => {
          const data: any = d.data();
          const date = data.date?.toDate ? data.date.toDate() : data.date;
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt;
          return { id: d.id, ...data, date, createdAt } as MaintenanceLog;
        });
        setLogs(items);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [range.start?.getTime(), range.end?.getTime()]);

  // Client-side filtering for keyword/category/technician
  const filtered = useMemo(() => {
    const keywordLc = (keyword || "").trim().toLowerCase();

    // Map parents for category inheritance checks
    const parentMap = new Map(assets.map(a => [a.id, a]));

    const categoryFilteredAssets =
      category === "All"
        ? assets
        : assets.filter(a => {
            if (a.category === category) return true;
            if (a.parentAssetId) {
              const p = parentMap.get(a.parentAssetId);
              return p?.category === category;
            }
            return false;
          });

    // asset ids that survive category
    const assetIdSet = new Set(categoryFilteredAssets.map(a => a.id));

    const techFilter = technicianId !== "All" ? technicianId : null;

    const logsFiltered = logs.filter((l) => {
      // keep only logs for assets in the category (parent or child)
      if (!assetIdSet.has(l.assetId)) return false;
      if (techFilter && l.technicianId !== techFilter) return false;

      if (keywordLc) {
        const haystack = [
          l.assetName,
          l.summary,
          l.details,
          l.technicianName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(keywordLc)) return false;
      }
      return true;
    });

    // Keyword can also match by asset name alone (even if no logs match)
    const keywordFilteredAssets = keywordLc
      ? categoryFilteredAssets.filter(a =>
          (a.name || "").toLowerCase().includes(keywordLc)
        )
      : categoryFilteredAssets;

    return {
      assets: keywordFilteredAssets,
      technicians,
      logs: logsFiltered,
    };
  }, [assets, technicians, logs, category, technicianId, keyword]);

  return { ...filtered, loading };
}