'use client';

import {useRouter} from "next/navigation";
import DiveForm from "@/components/DiveForm";
import {addDive} from "@/services/dives";
import ProtectedPage from "@/components/ProtectedPage";

export default function LogDivePage() {
  const router = useRouter();

  const handleSave = async (data: any) => {
    await addDive(data);
    router.push("/dives/view");
  };

  return (
    <ProtectedPage allowedRoles={['admin', 'manager', 'staff']}>
    <DiveForm
      onSave={handleSave}
      onCancel={() => router.push("/dives/view")}
    />
    </ProtectedPage>
  );
}
