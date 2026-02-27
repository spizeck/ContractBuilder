// Re-export shim — canonical source is now in the maintenance module
export {
  getTechnicians,
  getTechniciansPaginated,
  addTechnician,
  updateTechnician,
  deleteTechnician,
  onTechniciansSnapshot,
} from '../app/app/maintenance/_lib/techniciansRepo'

export type { PaginatedTechniciansResult } from '../app/app/maintenance/_lib/techniciansRepo'
