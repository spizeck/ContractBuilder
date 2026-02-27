// Re-export shim — maintenance dashboard types are now in the maintenance module
export type {
  DashboardFilter,
  TechnicianActivity,
  DashboardFilterResult,
} from '../app/app/maintenance/_types'

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
} from '../app/app/dive-log/_types'
