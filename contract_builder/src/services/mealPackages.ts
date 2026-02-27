// Re-export shim — canonical source is now in the contracts module
export {
  getMealPackages,
  addMealPackage,
  updateMealPackage,
  deleteMealPackage,
  getMealPackageById,
} from '../app/app/contracts/_lib/mealPackagesRepo'
