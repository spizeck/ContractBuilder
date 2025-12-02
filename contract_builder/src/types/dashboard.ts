import type { Asset, MaintenanceLog, Technician, AssetCategory } from "./maintenance";

// Unified dashboard filter state
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

// Technician activity data structure
export interface TechnicianActivity {
  technician: Technician;
  count: number;
  logs: MaintenanceLog[];
}

// Filter result structure
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
