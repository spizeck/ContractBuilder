'use client'

import { ChakraProvider } from '@chakra-ui/react'
import React from 'react'
import theme from '@shared/theme'
import { AuthProvider } from '@core/auth/AuthContext'
import { PermissionProvider } from '@core/permissions/PermissionProvider'

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
