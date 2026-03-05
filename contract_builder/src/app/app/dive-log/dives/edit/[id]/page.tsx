'use client';

import {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {Spinner} from "@chakra-ui/react";
import DiveForm from "../../components/diveForm/DiveForm";
import {deleteDive, getDive, updateDive} from "@/app/app/dive-log/_lib/divesRepo";
import {Dive} from "@/app/app/dive-log/_types";
import ProtectedRoute from "@shared/components/LayoutComponents/ProtectedRoute";

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
    router.push("/app/dive-log/dives/view");
  };

  const handleDelete = async () => {
    await deleteDive(id);
    router.push("/app/dive-log/dives/view");
  };

  return (
    <ProtectedRoute module="diveLog" permission="edit">
    <DiveForm
      initialDive={dive}
      onSave={handleSave}
      onCancel={() => router.push("/app/dive-log/dives/view")}
    />
    </ProtectedRoute>
  );
}