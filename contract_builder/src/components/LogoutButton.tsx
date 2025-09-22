"use client";

import { Button } from "@chakra-ui/react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export default function LogoutButton() {
  const { user } = useAuth();

  if (!user) return null; // don’t show if not logged in

  return (
    <Button
    variant="link"
      colorScheme="white"
      onClick={() => signOut(auth)}
      _hover={{ textDecoration: "underline" }}
    >
      Logout
    </Button>
  );
}
