import type {Metadata} from "next";
import {Inter} from "next/font/google";
import {ChakraProvider, Box, Flex, Heading, Link} from "@chakra-ui/react";
import "./globals.css";
import React from "react";

const inter = Inter({subsets: ["latin"]});

export const metadata: Metadata = {
  title: "Sea Saba Contract Builder",
  description: "App to assemble dive group contracts",
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
    <body className={inter.className}>
    <ChakraProvider>
      <Flex
        as="header"
        bg="teal.500"
        color="white"
        py={4}
        px={8}
        align="center"
        justify="space-between"
      >
        <Heading as="h1" size="lg">
          Sea Saba
        </Heading>
        <Flex as="nav" gap={6}>
          <Link href="/" _hover={{textDecoration: "underline"}}>
            Home
          </Link>
          <Link href="/contracts" _hover={{textDecoration: "underline"}}>
            Contracts
          </Link>
          <Link href="/hotels" _hover={{textDecoration: "underline"}}>
            Hotels
          </Link>
          <Link href="/dive-packages" _hover={{textDecoration: "underline"}}>
            Dive Packages
          </Link>
        </Flex>
      </Flex>

      <Box as="main" p={8}>
        {children}
      </Box>
    </ChakraProvider>
    </body>
    </html>
  );
}