// Re-export shim — canonical source is now in the contracts module
export {
  getRoomCategories,
  addRoomCategory,
  updateRoomCategory,
  deleteRoomCategory,
} from '../app/(staff)/contracts/_lib/roomCategoriesRepo'