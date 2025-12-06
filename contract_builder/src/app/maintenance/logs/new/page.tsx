import { Suspense } from "react";
import LogForm from "../components/LogForm";

export default function NewLogPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LogForm />
    </Suspense>
  );
}
