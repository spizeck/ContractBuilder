// Re-export shim — canonical source is now in the contracts module
export {
  getGroupContracts,
  addGroupContract,
  updateGroupContract,
  archiveGroupContract,
  getGroupContractById,
  formatBookingType,
} from '../app/app/contracts/_lib/groupContractsRepo'
