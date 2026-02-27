import { redirect } from 'next/navigation'

export default function DivesEditRedirect({ params }: { params: { id: string } }) {
  redirect(`/app/dive-log/dives/edit/${params.id}`)
}
