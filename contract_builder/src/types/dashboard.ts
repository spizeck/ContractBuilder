import type { Asset, MaintenanceLog, Technician, AssetCategory } from "./maintenance";
import type { Dive, Boat, Guide, Site, Species } from "./diveLogTypes";

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

// Dive Dashboard Types
export interface DiveDashboardStats {
  totalDives: number;
  divesLast7Days: number;
  divesByBoat: BoatDiveStats[];
  divesByGuide: GuideDiveStats[];
  averageTemperature: number;
}

export interface BoatDiveStats {
  boat: Boat;
  diveCount: number;
  percentage: number;
}

export interface GuideDiveStats {
  guide: Guide;
  diveCount: number;
  percentage: number;
}

export interface DailySiteMatrix {
  date: string;
  boatSites: BoatSiteEntry[];
}

export interface BoatSiteEntry {
  boat: Boat;
  sites: Site[];
  dives: Dive[];
}

export interface TemperatureTrend {
  date: string;
  temperature: number;
  diveCount: number;
}

export interface SiteVisitationData {
  site: Site;
  visitCount: number;
  lastVisited: Date;
  percentage: number;
}

export interface SeasonalWildlifePattern {
  month: string;
  species: Species[];
  totalSightings: number;
  diveCount: number;
}

export interface DiveDashboardData {
  stats: DiveDashboardStats;
  statsLast30Days: DiveDashboardStats;
  statsCurrentYear: DiveDashboardStats;
  siteMatrix: DailySiteMatrix[];
  temperatureTrends: TemperatureTrend[];
  siteVisitation: SiteVisitationData[];
  seasonalPatterns: SeasonalWildlifePattern[];
}
