import LogForm from "../LogForm"

export default async function EditLogPage({ params }: { params: { id: string } }) {
  const { id } = await params
  return <LogForm id={id} />
}
