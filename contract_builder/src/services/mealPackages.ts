// Re-export shim — canonical source is now in the contracts module
export {
  getMealPackages,
  addMealPackage,
  updateMealPackage,
  deleteMealPackage,
  getMealPackageById,
} from '../app/(staff)/contracts/_lib/mealPackagesRepo'
