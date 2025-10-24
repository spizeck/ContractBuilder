import { Suspense } from "react";
import LogForm from "@/components/maintenance/LogForm";

export default function EditLogPage(props: any) {
  const { id } = props.params;
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LogForm id={id} />
    </Suspense>
  );
}