'use client'

import {
  Flex,
  Heading,
  Link,
  Box,
} from '@chakra-ui/react'
import NextLink from 'next/link'
import NavLinks from '@shared/components/LayoutComponents/NavLinks'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
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
        {children}
      </Box>
    </Flex>
  )
}
