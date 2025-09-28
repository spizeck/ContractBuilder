"use client";

import { Button, MenuItem } from "@chakra-ui/react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export default function LogoutButton({ asMenuItem = false }) {
  const { user } = useAuth();
  if (!user) return null;

  if (asMenuItem) {
    return (
      <MenuItem onClick={() => signOut(auth)}>
        Logout
      </MenuItem>
    );
  }

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