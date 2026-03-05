// Re-export shim — canonical source is now in the contracts module
export {
  getRates,
  addRate,
  updateRate,
  deleteRate,
  getRateById,
} from '../app/(staff)/contracts/_lib/ratesRepo'