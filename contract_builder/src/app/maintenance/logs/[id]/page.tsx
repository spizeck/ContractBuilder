import { redirect } from 'next/navigation'

export default function MaintenanceLogRedirect({ params }: { params: { id: string } }) {
  redirect(`/app/maintenance/logs/${params.id}`)
}
