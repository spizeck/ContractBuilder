// Re-export shim — canonical source is now in the contracts module
export {
  addPayment,
  getPayments,
  updatePayment,
  deletePayment,
  addContractNote,
  getContractNotes,
  deleteContractNote,
  cloneContractDataForRevision,
  updateContractPaymentSummary,
} from '../app/(staff)/contracts/_lib/paymentsRepo'
