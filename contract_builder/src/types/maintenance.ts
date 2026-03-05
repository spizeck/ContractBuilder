// Re-export shim — canonical source is now in the maintenance module
export type {
  AssetCategory,
  ServiceTracking,
  AssetBase,
  AssetServiceNone,
  AssetServiceHours,
  AssetServiceKilometers,
  AssetServiceDate,
  Asset,
  Technician,
  MaintenanceLogKind,
  MaintenanceLog,
  StatusColor,
} from '../app/(staff)/maintenance/_types'

export {
  isHoursTracked,
  isKmTracked,
  isDateTracked,
} from '../app/(staff)/maintenance/_types'
