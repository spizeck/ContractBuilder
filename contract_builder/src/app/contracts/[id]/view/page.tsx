import { redirect } from 'next/navigation'

export default function ContractViewRedirect({ params }: { params: { id: string } }) {
  redirect(`/app/contracts/${params.id}/view`)
}
