'use client'

import { ChakraProvider } from '@chakra-ui/react'
import React from 'react'
import theme from '@/theme'
import { AuthProvider } from '@/context/AuthContext'
import { PermissionProvider } from '@/context/PermissionProvider'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider theme={theme} resetCSS={true} disableGlobalStyle={false}>
      <AuthProvider>
        <PermissionProvider>
          {children}
        </PermissionProvider>
      </AuthProvider>
    </ChakraProvider>
  )
}
