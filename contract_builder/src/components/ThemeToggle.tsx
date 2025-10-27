"use client";

import { IconButton, useColorMode, useColorModeValue } from "@chakra-ui/react";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";

export default function ThemeToggle() {
  const { colorMode, toggleColorMode } = useColorMode();
  const iconColor = useColorModeValue("gray.800", "white");
  return (
    <IconButton
      aria-label="Toggle theme"
      icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
      onClick={toggleColorMode}
      variant="ghost"
      color={iconColor}
      _hover={{ bg: "transparent" }}
      size="sm"
    />
  );
}