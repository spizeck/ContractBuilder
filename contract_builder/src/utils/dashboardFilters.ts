import type { Asset, MaintenanceLog, Technician, AssetCategory } from "@/types/maintenance";
import type { DashboardFilter, DashboardFilterResult, TechnicianActivity } from "@/types/dashboard";
import { getAssetStatus } from "@/utils/maintenanceSelectors";

/**
 * Configuration constants for filtering behavior
 * These can be easily tweaked to adjust business logic
 */
export const FILTER_CONFIG = {
  // Definition of "overdue" - any asset with status "Overdue"
  isOverdue: (asset: Asset) => getAssetStatus(asset) === "Overdue",
  
  // Definition of "upcoming services" - any asset with status "Due Soon"
  isUpcoming: (asset: Asset) => getAssetStatus(asset) === "Due Soon",
  
  // Window for "upcoming services" - handled by getAssetStatus logic
  // Currently uses the existing status determination logic
  
  // Definition of "logs this month" - logs from current month
  getLogsThisMonthRange: () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start: startOfMonth, end: endOfMonth };
  },
  
  // Date range filtering behavior:
  // When date filter is applied, assets are still shown but only their logs within the date range are considered
  // This means assets with no logs in the date range will still appear in the asset list
  // but won't be counted in stats that depend on logs (like logsThisMonth)
  hideAssetsWithoutLogsInDateRange: false,
} as const;

/**
 * Pure function to apply all dashboard filters
 * Returns filtered data and calculated stats
 */
export function applyDashboardFilters(
  assets: Asset[],
  logs: MaintenanceLog[],
  technicians: Technician[],
  filters: DashboardFilter
): DashboardFilterResult {
  // Step 1: Apply date range filter to logs first
  const dateFilteredLogs = filterLogsByDateRange(logs, filters.dateRange);
  
  // Step 2: Apply technician filter to logs
  const technicianFilteredLogs = filters.technicianId !== "All" 
    ? dateFilteredLogs.filter(log => log.technicianId === filters.technicianId)
    : dateFilteredLogs;
  
  // Step 3: Apply category filter to logs (filter logs by assets that match category)
  let categoryFilteredLogs = technicianFilteredLogs;
  if (filters.categoryId !== "All") {
    // Get asset IDs that match the category (including children)
    const matchingAssetIds = new Set<string>();
    for (const asset of assets) {
      if (asset.category === filters.categoryId) {
        matchingAssetIds.add(asset.id);
      }
      // Add children of matching parents
      if (asset.parentAssetId) {
        const parent = assets.find(a => a.id === asset.parentAssetId);
        if (parent && parent.category === filters.categoryId) {
          matchingAssetIds.add(asset.id);
        }
      }
    }
    categoryFilteredLogs = technicianFilteredLogs.filter(log => matchingAssetIds.has(log.assetId));
  }
  
  // Step 4: Apply search filter to logs (if not just searching asset names)
  let searchFilteredLogs = categoryFilteredLogs;
  if (filters.searchTerm.trim()) {
    const searchLower = filters.searchTerm.toLowerCase();
    searchFilteredLogs = categoryFilteredLogs.filter(log =>
      log.summary.toLowerCase().includes(searchLower) ||
      (log.details && log.details.toLowerCase().includes(searchLower)) ||
      (log.technicianName && log.technicianName.toLowerCase().includes(searchLower))
    );
  }
  
  // Step 5: Apply card filter (which may override date range)
  const cardFilteredLogs = applyCardFilter(searchFilteredLogs, filters.cardFilter);
  
  // Step 6: For asset filtering, determine which logs to use
  let logsForAssetFiltering = logs;
  let logsForStats = cardFilteredLogs;
  
  if (filters.searchTerm.trim()) {
    // For search, we need special handling:
    // - Asset filtering should use ALL logs to find assets with matching logs
    // - Stats should use only the matching logs
    logsForAssetFiltering = logs;
    logsForStats = searchFilteredLogs;
  } else if (filters.technicianId !== "All" || filters.cardFilter || (filters.dateRange.from || filters.dateRange.to) || filters.categoryId !== "All") {
    // For other filters, use the filtered logs for consistency
    logsForAssetFiltering = cardFilteredLogs;
    logsForStats = cardFilteredLogs;
  }
  
  const filteredAssets = filterAssets(assets, logsForAssetFiltering, filters);
  
  // Step 7: Generate technician activities from FILTERED data (for display consistency)
  const filteredTechnicianActivities = generateTechnicianActivities(
    technicians,
    cardFilteredLogs,
    filters
  );
  
  // Step 8: Calculate stats from the appropriate logs
  const stats = calculateStats(filteredAssets, logsForStats, filters);
  
  return {
    filteredAssets,
    filteredTechnicianActivities,
    stats,
  };
}

/**
 * Filter logs by date range
 */
function filterLogsByDateRange(logs: MaintenanceLog[], dateRange: { from: Date | null; to: Date | null }): MaintenanceLog[] {
  if (!dateRange.from && !dateRange.to) return logs;
  
  return logs.filter((log) => {
    const logDate = new Date(log.date);
    
    if (dateRange.from && logDate < dateRange.from) return false;
    if (dateRange.to && logDate > dateRange.to) return false;
    
    return true;
  });
}

/**
 * Apply card-specific filters that may override other filters
 */
function applyCardFilter(logs: MaintenanceLog[], cardFilter: DashboardFilter["cardFilter"]): MaintenanceLog[] {
  if (!cardFilter) return logs;
  
  switch (cardFilter) {
    case "LOGS_THIS_MONTH": {
      const { start, end } = FILTER_CONFIG.getLogsThisMonthRange();
      return logs.filter((log) => {
        const logDate = new Date(log.date);
        return logDate >= start && logDate <= end;
      });
    }
    
    case "OVERDUE_SERVICES":
      // For overdue services, we don't filter logs by date
      // The asset filtering will handle showing only overdue assets
      return logs;
    
    case "UPCOMING_SERVICES":
      // For upcoming services, we don't filter logs by date
      // The asset filtering will handle showing only upcoming assets
      return logs;
    
    default:
      return logs;
  }
}

/**
 * Filter assets based on all criteria
 */
function filterAssets(assets: Asset[], logs: MaintenanceLog[], filters: DashboardFilter): Asset[] {
  // Create a map of logs by asset ID for efficient lookup
  const logsByAsset = new Map<string, MaintenanceLog[]>();
  for (const log of logs) {
    if (!logsByAsset.has(log.assetId)) {
      logsByAsset.set(log.assetId, []);
    }
    logsByAsset.get(log.assetId)!.push(log);
  }
  
  // Create parent-child relationships map
  const childrenByParent = new Map<string, Asset[]>();
  for (const asset of assets) {
    if (asset.parentAssetId) {
      if (!childrenByParent.has(asset.parentAssetId)) {
        childrenByParent.set(asset.parentAssetId, []);
      }
      childrenByParent.get(asset.parentAssetId)!.push(asset);
    }
  }
  
  // First pass: determine which assets match the filters
  const matchingAssetIds = new Set<string>();
  
  for (const asset of assets) {
    let matches = true;
    
    // Category filter
    if (filters.categoryId !== "All" && asset.category !== filters.categoryId) {
      // Check if it's a child asset that should inherit parent category
      if (!asset.parentAssetId) {
        matches = false;
      } else {
        const parent = assets.find(a => a.id === asset.parentAssetId);
        if (!parent || parent.category !== filters.categoryId) {
          matches = false;
        }
      }
    }
    
    // Search filter - search in asset name and related logs
    if (matches && filters.searchTerm.trim()) {
      const searchLower = filters.searchTerm.toLowerCase();
      const assetMatches = asset.name.toLowerCase().includes(searchLower);
      
      if (!assetMatches) {
        const assetLogs = logsByAsset.get(asset.id) || [];
        const logMatches = assetLogs.some((log) =>
          log.summary.toLowerCase().includes(searchLower) ||
          (log.details && log.details.toLowerCase().includes(searchLower)) ||
          (log.technicianName && log.technicianName.toLowerCase().includes(searchLower))
        );
        if (!logMatches) matches = false;
      }
    }
    
    // Technician filter - only show assets with logs by this technician
    if (matches && filters.technicianId !== "All") {
      const assetLogs = logsByAsset.get(asset.id) || [];
      const hasTechnicianLogs = assetLogs.some((log) => log.technicianId === filters.technicianId);
      if (!hasTechnicianLogs) matches = false;
    }
    
    // Card filters
    if (matches && filters.cardFilter === "OVERDUE_SERVICES") {
      matches = FILTER_CONFIG.isOverdue(asset);
    }
    
    if (matches && filters.cardFilter === "UPCOMING_SERVICES") {
      matches = FILTER_CONFIG.isUpcoming(asset);
    }
    
    // Date range filter behavior (configurable)
    if (matches && (filters.dateRange.from || filters.dateRange.to)) {
      if (FILTER_CONFIG.hideAssetsWithoutLogsInDateRange) {
        const assetLogs = logsByAsset.get(asset.id) || [];
        if (assetLogs.length === 0) matches = false;
      }
    }
    
    if (matches) {
      matchingAssetIds.add(asset.id);
    }
  }
  
  // Second pass: include parents of matching child assets
  const finalAssetIds = new Set(matchingAssetIds);
  
  for (const assetId of matchingAssetIds) {
    const asset = assets.find(a => a.id === assetId);
    if (asset?.parentAssetId) {
      // Add the parent if a child matches
      finalAssetIds.add(asset.parentAssetId);
    }
  }
  
  // Return all assets that either match directly or are parents of matching assets
  return assets.filter(asset => finalAssetIds.has(asset.id));
}

/**
 * Generate technician activities from filtered logs
 */
function generateTechnicianActivities(
  technicians: Technician[],
  logs: MaintenanceLog[],
  filters: DashboardFilter
): TechnicianActivity[] {
  // Group logs by technician
  const logsByTechnician = new Map<string, MaintenanceLog[]>();
  for (const log of logs) {
    if (!log.technicianId) continue;
    
    if (!logsByTechnician.has(log.technicianId)) {
      logsByTechnician.set(log.technicianId, []);
    }
    logsByTechnician.get(log.technicianId)!.push(log);
  }
  
  // Create activity objects
  return technicians
    .map((technician) => ({
      technician,
      count: logsByTechnician.get(technician.id)?.length || 0,
      logs: logsByTechnician.get(technician.id) || [],
    }))
    .filter((activity) => activity.count > 0)
    .sort((a, b) => b.count - a.count);
}

/**
 * Calculate statistics from filtered data
 */
function calculateStats(assets: Asset[], logs: MaintenanceLog[], filters: DashboardFilter): DashboardFilterResult["stats"] {
  // Total assets - count from filtered assets
  const totalAssets = assets.length;
  
  // Total logs - count from filtered logs (not just this month)
  const totalLogs = logs.length;
  
  // Overdue and upcoming services - count from filtered assets
  const overdueServices = assets.filter(FILTER_CONFIG.isOverdue).length;
  const upcomingServices = assets.filter(FILTER_CONFIG.isUpcoming).length;
  
  return {
    totalAssets,
    logsThisMonth: totalLogs, // Renamed but keeping same property for compatibility
    overdueServices,
    upcomingServices,
  };
}
