import { redirect } from 'next/navigation'

export default function DivesDashboardRedirect() {
  redirect('/app/dive-log/dives/dashboard')
}
