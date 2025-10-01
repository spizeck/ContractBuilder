import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from './providers'
import { ColorModeScript } from '@chakra-ui/react'
import theme from '@/theme'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sea Saba Business App',
  description: 'App to assemble dive group contracts and manage Dive Logs'
}

export default function RootLayout ({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang='en'>
      <head>
        {/* Ensure Chakra sets correct class before hydration */}
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
