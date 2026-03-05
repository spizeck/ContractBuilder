// Re-export shim — canonical source is now in the maintenance module
export {
  getTrackingLabel,
  getCurrentReading,
  getNextDueDisplay,
  getAssetStatus,
  getStatusColor,
} from '../app/(staff)/maintenance/_lib/maintenanceSelectors'

export type { StatusColor } from '../app/(staff)/maintenance/_lib/maintenanceSelectors'
