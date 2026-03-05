import type { Asset, MaintenanceLog, Technician, AssetCategory } from "./maintenance";

// Maintenance dashboard types (existing)
export type DashboardFilter = {
  searchTerm: string;
  categoryId: AssetCategory | "All";
  technicianId: string | "All";
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  cardFilter: null | "LOGS_THIS_MONTH" | "OVERDUE_SERVICES" | "UPCOMING_SERVICES";
};

export interface TechnicianActivity {
  technician: Technician;
  count: number;
  logs: MaintenanceLog[];
}

export interface DashboardFilterResult {
  filteredAssets: Asset[];
  filteredTechnicianActivities: TechnicianActivity[];
  stats: {
    totalAssets: number;
    logsThisMonth: number;
    overdueServices: number;
    upcomingServices: number;
  };
}

// Re-export dive dashboard types — canonical source is now in the dive-log module
export type {
  DiveDashboardStats,
  BoatDiveStats,
  GuideDiveStats,
  DailySiteMatrix,
  BoatSiteEntry,
  TemperatureTrend,
  SiteVisitationData,
  SeasonalWildlifePattern,
  DiveDashboardData,
} from '../app/(staff)/dive-log/_types'
