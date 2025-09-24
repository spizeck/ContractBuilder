'use client';

import {useRouter} from "next/navigation";
import DiveForm from "@/components/DiveForm";
import {addDive} from "@/services/dives";

export default function LogDivePage() {
  const router = useRouter();

  const handleSave = async (data: any) => {
    await addDive(data);
    router.push("/dives/view");
  };

  return (
    <DiveForm
      onSave={handleSave}
      onCancel={() => router.push("/dives/view")}
    />
  );
}
