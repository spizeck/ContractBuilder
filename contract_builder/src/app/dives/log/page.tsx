'use client';

import {useRouter} from "next/navigation";
import DiveForm from "../components/diveForm/DiveForm";
import {addDive} from "@/services/dives";
import ProtectedPage from "@/components/shared/LayoutComponents/ProtectedPage";

export default function LogDivePage() {
  const router = useRouter();

  const handleSave = async (data: any) => {
    await addDive(data);
    router.push("/dives/log");
  };

  return (
    <ProtectedPage allowedRoles={['admin', 'hotel-manager', 'hotel-staff']}>
    <DiveForm
      onSave={handleSave}
      onCancel={() => router.push("/dives/dashboard")}
    />
    </ProtectedPage>
  );
}
