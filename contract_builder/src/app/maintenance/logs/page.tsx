import { redirect } from 'next/navigation'

export default function MaintenanceLogsRedirect() {
  redirect('/app/maintenance/logs')
}
