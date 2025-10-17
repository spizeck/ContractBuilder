'use client';

import {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {Spinner} from "@chakra-ui/react";
import DiveForm from "@/components/diveForm/DiveForm";
import {deleteDive, getDive, updateDive} from "@/services/dives";
import {Dive} from "@/types/diveLogTypes";
import ProtectedPage from "@/components/ProtectedPage";

export default function EditDivePage() {
  const {id} = useParams<{ id: string }>();
  const router = useRouter();
  const [dive, setDive] = useState<Dive | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getDive(id).then(d => {
      setDive(d);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <Spinner/>;
  if (!dive) return <p>Dive not found</p>;

  const handleSave = async (data: any) => {
    await updateDive(id, data);
    router.push("/dives/view");
  };

  const handleDelete = async () => {
    await deleteDive(id);
    router.push("/dives/view");
  };

  return (
    <ProtectedPage allowedRoles={["admin", "manager", "staff"]}>
    <DiveForm
      initialDive={dive}
      onSave={handleSave}
      onCancel={() => router.push("/dives/view")}
    />
    </ProtectedPage>
  );
}