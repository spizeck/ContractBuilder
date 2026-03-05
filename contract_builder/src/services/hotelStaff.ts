// Re-export shim — canonical source is now in the contracts module
export {
  getHotelByStaffId,
  getContractsByHotelId,
  getContractsForStaff,
  updateHotelDetails,
  getStaffProfile,
} from '../app/(staff)/contracts/_lib/hotelStaffRepo'
