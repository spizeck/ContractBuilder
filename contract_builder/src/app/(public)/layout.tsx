'use client'

import { Flex, Box } from '@chakra-ui/react'
import PublicHeader from '@shared/components/PublicHeader'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <Flex direction="column" minH="100vh">
      <PublicHeader />
      <Box as="main" p={8} flex={1}>
        {children}
      </Box>
    </Flex>
  )
}
