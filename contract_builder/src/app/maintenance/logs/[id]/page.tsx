import LogForm from "@/components/maintenance/LogForm";

// export default function EditLogPage(props: any) {
//   const { id } = props.params;
//   return <LogForm id={id} />;
// }

export default async function EditLogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <LogForm id={id} />
}