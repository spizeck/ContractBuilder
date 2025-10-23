import LogForm from "@/components/LogForm";

export default function EditLogPage({ params }: { params: { id: string } }) {
  const { id } = params;
  return <LogForm id={id} />;
}
