import { Suspense } from "react";
import LogForm from "@/components/maintenance/LogForm";

export default function NewLogPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LogForm />
    </Suspense>
  );
}
