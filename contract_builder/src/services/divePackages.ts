// Re-export shim — canonical source is now in the contracts module
export {
  getDivePackages,
  addDivePackage,
  updateDivePackage,
  deleteDivePackage,
  getDivePackageById,
} from '../app/(staff)/contracts/_lib/divePackagesRepo'