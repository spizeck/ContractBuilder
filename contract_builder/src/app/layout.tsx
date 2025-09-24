import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ChakraProvider, Box, Flex, Heading } from '@chakra-ui/react'
import './globals.css'
import React from 'react'
import { AuthProvider } from '@/context/AuthContext'
import NavLinks from '@/components/NavLinks'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sea Saba Business App',
  description: 'App to assemble dive group contracts and manage Dive Logs'
}

export default function RootLayout ({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en'>
      <body className={inter.className}>
        <ChakraProvider>
          <AuthProvider>
            <Flex
              as='header'
              bg='teal.500'
              color='white'
              py={4}
              px={8}
              align='center'
              justify='space-between'
            >
              <Heading as='h1' size='lg'>
                Sea Saba
              </Heading>
              <NavLinks /> 
            </Flex>

            <Box as='main' p={8}>
              {children}
            </Box>
          </AuthProvider>
        </ChakraProvider>
      </body>
    </html>
  )
}
