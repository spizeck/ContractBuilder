"use client";

import {ReactNode, useEffect} from "react";
import {useRouter} from "next/navigation";
import {useAuth} from "@core/auth/AuthContext";
import {Center, Spinner} from "@chakra-ui/react";

interface Props {
  children: ReactNode;
  allowedRoles?: string[]; // e.g. ["admin", "hotel-manager"]
}

export default function ProtectedPage({children, allowedRoles}: Props) {
  const {user, role, loading} = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <Center minH="50vh">
        <Spinner/>
      </Center>
    );
  }

  if (!user) return null;

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Center minH="50vh">Access denied.</Center>;
  }

  return <>{children}</>
}
