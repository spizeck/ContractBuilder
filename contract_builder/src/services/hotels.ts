// Re-export shim — canonical source is now in the contracts module
export {
  addHotel,
  getHotels,
  updateHotel,
  deleteHotel,
  getHotelById,
} from '../app/app/contracts/_lib/hotelsRepo'
