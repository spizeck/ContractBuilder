'use client';

import {useRouter} from "next/navigation";
import DiveForm from "../components/diveForm/DiveForm";
import {addDive} from "@/services/dives";
import ProtectedRoute from "@/components/shared/LayoutComponents/ProtectedRoute";

export default function LogDivePage() {
  const router = useRouter();

  const handleSave = async (data: any) => {
    await addDive(data);
    router.push("/dives/log");
  };

  return (
    <ProtectedRoute module="diveLog" permission="create">
    <DiveForm
      onSave={handleSave}
      onCancel={() => router.push("/dives/dashboard")}
    />
    </ProtectedRoute>
  );
}
