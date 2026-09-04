'use client'

import { ChakraProvider } from '@chakra-ui/react'
import React from 'react'
import theme from '@shared/theme'
import { AuthProvider } from '@core/auth/AuthContext'
import { PermissionProvider } from '@core/permissions/PermissionProvider'
import ThemeSync from '@shared/components/ThemeSync'
import PwaManager from '@shared/components/PwaManager'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider theme={theme} resetCSS={true} disableGlobalStyle={false}>
      <AuthProvider>
        <ThemeSync />
        <PermissionProvider>
          {children}
          <PwaManager />
        </PermissionProvider>
      </AuthProvider>
    </ChakraProvider>
  )
}
