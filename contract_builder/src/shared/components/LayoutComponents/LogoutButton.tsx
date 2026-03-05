"use client";

import { Button, MenuItem } from "@chakra-ui/react";
import { useAuth } from "@core/auth/AuthContext";

export default function LogoutButton({ asMenuItem = false }) {
  const { user, logout } = useAuth();
  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (asMenuItem) {
    return (
      <MenuItem onClick={handleLogout}>
        Logout
      </MenuItem>
    );
  }

  return (
    <Button
      variant="link"
      colorScheme="white"
      onClick={handleLogout}
      _hover={{ textDecoration: "underline" }}
    >
      Logout
    </Button>
  );
}