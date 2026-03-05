// Re-export shim — canonical source is now in the contracts module
export {
  calculateNumberOfNights,
  determineSeason,
  getOccupancyNumber,
  getCommissionRate,
  calculateTotalCost,
} from '../app/(staff)/contracts/_lib/contractCalculations'
