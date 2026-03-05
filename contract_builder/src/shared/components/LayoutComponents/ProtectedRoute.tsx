"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@core/auth/AuthContext";
import { usePermissions } from "@core/permissions/PermissionProvider";
import { Center, Spinner, Alert, AlertIcon } from "@chakra-ui/react";
import { PermissionLevel, ModulePermissions } from "@core/types/permissions";

interface Props {
  children: ReactNode;
  module?: keyof ModulePermissions; // Module name from permissions
  permission?: PermissionLevel; // Required permission level
  fallback?: ReactNode; // Custom fallback for unauthorized access
  adminOnly?: boolean; // Shortcut for admin-only routes
}

export default function ProtectedRoute({ 
  children, 
  module, 
  permission, 
  fallback,
  adminOnly = false 
}: Props) {
  const { user, loading: authLoading } = useAuth();
  const { hasPermission, isAdmin, canAccessModule } = usePermissions();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <Center minH="50vh">
        <Spinner />
      </Center>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return null;
  }

  // Check admin-only routes
  if (adminOnly && !isAdmin()) {
    return fallback || (
      <Center minH="50vh">
        <Alert status="error" maxW="400px">
          <AlertIcon />
          Admin access required
        </Alert>
      </Center>
    );
  }

  // Check module access
  if (module && !canAccessModule(module)) {
    return fallback || (
      <Center minH="50vh">
        <Alert status="warning" maxW="400px">
          <AlertIcon />
          You don't have access to this module
        </Alert>
      </Center>
    );
  }

  // Check specific permission level
  if (module && permission && !hasPermission(module, permission)) {
    return fallback || (
      <Center minH="50vh">
        <Alert status="warning" maxW="400px">
          <AlertIcon />
          {permission} access required for this module
        </Alert>
      </Center>
    );
  }

  // All checks passed, render children
  return <>{children}</>;
}
