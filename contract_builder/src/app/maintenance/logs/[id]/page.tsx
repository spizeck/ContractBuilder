import LogForm from "@/components/LogForm";

export default function EditLogPage(props: any) {
  const { id } = props.params;
  return <LogForm id={id} />;
}