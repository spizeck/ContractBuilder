import { redirect } from 'next/navigation'

export default function MaintenanceAssetsRedirect() {
  redirect('/app/maintenance/assets')
}
