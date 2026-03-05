"use client";

import { Button, MenuItem } from "@chakra-ui/react";
import { signOut } from "firebase/auth";
import { auth } from "@core/db/firebase";
import { useAuth } from "@core/auth/AuthContext";

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