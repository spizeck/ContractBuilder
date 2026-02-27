// Re-export shim — canonical source is now in the maintenance module
export {
  normalizeAsset,
  getAssets,
  addAsset,
  updateAsset,
  deleteAsset,
  getSubAssets,
  getParentAsset,
  linkAssets,
  unlinkAssets,
  subscribeAssets,
  onAssetsSnapshot,
} from '../app/app/maintenance/_lib/assetsRepo'
