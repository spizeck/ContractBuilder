'use client'

import {
  ChakraProvider,
  Flex,
  Heading,
  Link,
  Box,
} from '@chakra-ui/react'
import NextLink from 'next/link'
import React from 'react'
import theme from '@/theme'
import { AuthProvider } from '@/context/AuthContext'
import { PermissionProvider } from '@/context/PermissionProvider'
import NavLinks from '@/components/shared/LayoutComponents/NavLinks'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider theme={theme} resetCSS={true} disableGlobalStyle={false}>
      <AuthProvider>
        <Flex direction="column" minH="100vh">
          <Flex
            as="header"
            bg="teal.500"
            color="white"
            py={4}
            px={8}
            align="center"
            justify="space-between"
            className="no-print"
            suppressHydrationWarning={true}
          >
            <Link as={NextLink} href="/" _hover={{ textDecoration: 'none' }}>
              <Heading as="h1" size="lg">
                Sea Saba
              </Heading>
            </Link>
            <NavLinks />
          </Flex>

          <Box as="main" p={8} flex={1}>
            <PermissionProvider>
              {children}
            </PermissionProvider>
          </Box>
        </Flex>
      </AuthProvider>
    </ChakraProvider>
  )
}
