export interface Sighting {
  speciesId: string;
  count: number;
}

export interface Dive {
  id: string;
  date: string | Date; // YYYY-MM-DD string preferred, but may be Date from Firestore
  diveSlot: DiveSlot; // replaces diveNumber
  boatId: string;
  diveGuide: string;
  diveSiteId: string;
  maxDepth: number; // meters
  waterTemperature: number; // celsius
  isDrift?: boolean; // indicates if dive was done as a drift dive
  sightings: Sighting[];
  createdBy: string;
  createdAt?: Date;
}

export interface Species {
  id: string;
  name: string;
  active: boolean;
  scientificName?: string;
  category?: string;
  step?: number; // form grouping
  icon?: string;
  iucnStatus?: string;
}

export interface Site {
  id: string;
  name: string;
  active: boolean;
  region?: string;
  habitatType?: string;
  protectedArea?: boolean;
  depthRange?: string;
}

export interface Boat {
  id: string;
  name: string;
  active: boolean;
  createdAt?: any
}

export interface FormattedDive extends Dive {
  boatName: string;
  siteName: string;
  depthDisplay: string;
  tempDisplay: string;
}

export interface Guide {
  id: string;
  name: string;
  active: boolean;
}

export type DiveSlot =
  | "9am"
  | "11am"
  | "1pm"
  | "4pm"
  | "night";

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
