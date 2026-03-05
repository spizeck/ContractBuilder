// Re-export shim — canonical source is now in the maintenance module
export {
  normalizeLog,
  getMaintenanceLogs,
  addMaintenanceLog,
  updateMaintenanceLog,
  deleteMaintenanceLog,
  getMaintenanceLog,
  onLogsForAsset,
  onLogsInDateRange,
} from '../app/(staff)/maintenance/_lib/maintenanceRepo'
