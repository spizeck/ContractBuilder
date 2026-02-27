// Re-export shim — canonical source is now in the dive-log module
export {
  getDives,
  addDive,
  getDive,
  updateDive,
  deleteDive,
  getUserDives,
  checkDuplicateDive,
  getDivesPage,
} from '../app/app/dive-log/_lib/divesRepo'
