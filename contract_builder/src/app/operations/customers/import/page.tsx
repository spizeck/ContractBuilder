"use client";

import ProtectedPage from "@/components/shared/LayoutComponents/ProtectedPage";
import CustomerImport from "@/app/manifests/components/CustomerImport";

export default function CustomerImportPage() {
  return (
    <ProtectedPage allowedRoles={['admin', 'hotel-manager', 'hotel-staff']}>
      <CustomerImport />
    </ProtectedPage>
  );
}
