"use client";

import { Flex, Link } from "@chakra-ui/react";
import NextLink from "next/link";
import { useAuth } from "@/context/AuthContext";
import LogoutButton from "@/components/LogoutButton";

export default function NavLinks() {
  const { user } = useAuth();

  return (
    <Flex as="nav" gap={6} align="center">
      <Link as={NextLink} href="/" _hover={{ textDecoration: "underline" }}>
        Home
      </Link>
      <Link as={NextLink} href="/contracts" _hover={{ textDecoration: "underline" }}>
        Contracts
      </Link>
      <Link as={NextLink} href="/hotels" _hover={{ textDecoration: "underline" }}>
        Hotels
      </Link>
      <Link as={NextLink} href="/dive-packages" _hover={{ textDecoration: "underline" }}>
        Dive Packages
      </Link>

      {user ? (
        <LogoutButton />
      ) : (
        <>
          <Link as={NextLink} href="/login" _hover={{ textDecoration: "underline" }}>
            Login
          </Link>
          <Link as={NextLink} href="/register" _hover={{ textDecoration: "underline" }}>
            Register
          </Link>
        </>
      )}
    </Flex>
  );
}
