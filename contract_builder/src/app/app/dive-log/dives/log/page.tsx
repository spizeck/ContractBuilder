'use client';

import {useState} from "react";
import {useRouter} from "next/navigation";
import { useToast } from "@chakra-ui/react";
import DiveForm from "../components/diveForm/DiveForm";
import {addDive} from "@/services/dives";
import ProtectedRoute from "@/components/shared/LayoutComponents/ProtectedRoute";

export default function LogDivePage() {
  const router = useRouter();
  const toast = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [formKey, setFormKey] = useState(0); // Used to reset the form

  const handleSave = async (data: any) => {
    console.log('=== HANDLE SAVE DEBUG ===');
    console.log('Starting save process...');
    
    if (isSaving) {
      console.log('Already saving - ignoring duplicate click');
      return;
    }
    
    setIsSaving(true);
    
    try {
      console.log('Calling addDive...');
      await addDive(data);
      console.log('addDive completed successfully');
      
      console.log('Creating toast notification...');
      toast({
        title: "Dive saved successfully!",
        description: "Your dive has been logged. Form reset for next dive.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      console.log('Toast notification created');
      
      // Reset form by incrementing key instead of redirecting
      console.log('Resetting form for next dive...');
      setFormKey(prev => prev + 1);
      console.log('Form reset completed');
      
    } catch (error) {
      console.error('Error in handleSave:', error);
      toast({
        title: "Error saving dive",
        description: "There was a problem saving your dive. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
      console.log('Save process completed, loading state reset');
    }
    
    console.log('=== END HANDLE SAVE DEBUG ===');
  };

  return (
    <ProtectedRoute module="diveLog" permission="create">
    <DiveForm
      key={formKey} // This forces form reset when key changes
      onSave={handleSave}
      onCancel={() => router.push("/app/dive-log/dives/dashboard")}
      isSaving={isSaving}
    />
    </ProtectedRoute>
  );
}
