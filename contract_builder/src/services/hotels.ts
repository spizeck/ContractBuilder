// Re-export shim — canonical source is now in the contracts module
export {
  addHotel,
  getHotels,
  updateHotel,
  deleteHotel,
  getHotelById,
} from '../app/(staff)/contracts/_lib/hotelsRepo'
