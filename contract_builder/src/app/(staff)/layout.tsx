'use client'

import { Flex, Box } from '@chakra-ui/react'
import AppHeader from '@shared/components/LayoutComponents/AppHeader'
import NavLinks from '@shared/components/LayoutComponents/NavLinks'

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <Flex direction="column" minH="100vh">
      <AppHeader rightContent={<NavLinks />} />
      <Box as="main" p={8} flex={1}>
        {children}
      </Box>
    </Flex>
  )
}
