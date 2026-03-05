// Re-export shim — canonical source is now in the contracts module
export {
  getGroupContracts,
  addGroupContract,
  updateGroupContract,
  archiveGroupContract,
  getGroupContractById,
  formatBookingType,
} from '../app/(staff)/contracts/_lib/groupContractsRepo'
