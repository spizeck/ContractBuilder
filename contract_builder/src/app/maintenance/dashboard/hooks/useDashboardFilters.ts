"use client";

import { useState, useMemo } from "react";
import type { Asset, MaintenanceLog, Technician, AssetCategory } from "@/types/maintenance";
import type { DashboardFilter, DashboardFilterResult } from "@/types/dashboard";
import { applyDashboardFilters } from "@/utils/dashboardFilters";

const INITIAL_FILTER: DashboardFilter = {
  searchTerm: "",
  categoryId: "All",
  technicianId: "All",
  dateRange: { from: null, to: null },
  cardFilter: null,
};

export function useDashboardFilters(
  assets: Asset[],
  logs: MaintenanceLog[],
  technicians: Technician[]
) {
  const [filters, setFilters] = useState<DashboardFilter>(INITIAL_FILTER);

  // Apply filters using the pure function
  const filterResult = useMemo(() => {
    return applyDashboardFilters(assets, logs, technicians, filters);
  }, [assets, logs, technicians, filters]);

  // Update functions for each filter type
  const updateFilters = {
    searchTerm: (value: string) => {
      setFilters((prev) => ({ ...prev, searchTerm: value, cardFilter: null }));
    },
    
    categoryId: (value: AssetCategory | "All") => {
      setFilters((prev) => ({ ...prev, categoryId: value, cardFilter: null }));
    },
    
    technicianId: (value: string | "All") => {
      setFilters((prev) => ({ ...prev, technicianId: value, cardFilter: null }));
    },
    
    dateRange: (value: { from: Date | null; to: Date | null }) => {
      setFilters((prev) => ({ ...prev, dateRange: value, cardFilter: null }));
    },
    
    cardFilter: (value: DashboardFilter["cardFilter"]) => {
      setFilters((prev) => ({
        ...prev,
        cardFilter: value,
        // When a card filter is selected, clear other filters to avoid conflicts
        searchTerm: value ? "" : prev.searchTerm,
        // Keep category and technician filters as they make sense with card filters
        // Date range is handled by the card filter logic
      }));
    },
    
    // Reset all filters
    reset: () => {
      setFilters(INITIAL_FILTER);
    },
    
    // Set multiple filters at once
    setAll: (newFilters: Partial<DashboardFilter>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
  };

  return {
    filters,
    filterResult,
    updateFilters,
    // Convenience getters
    hasActiveFilters: filters.searchTerm.trim() !== "" || 
                     filters.categoryId !== "All" || 
                     filters.technicianId !== "All" || 
                     filters.dateRange.from !== null || 
                     filters.dateRange.to !== null || 
                     filters.cardFilter !== null,
  };
}
