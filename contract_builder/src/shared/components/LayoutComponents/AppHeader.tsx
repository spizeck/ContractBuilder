'use client'

import { Flex, Heading, Link } from '@chakra-ui/react'
import NextLink from 'next/link'
import { ReactNode } from 'react'

interface AppHeaderProps {
  rightContent?: ReactNode
}

export default function AppHeader({ rightContent }: AppHeaderProps) {
  return (
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
      {rightContent}
    </Flex>
  )
}
