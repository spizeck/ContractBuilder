// src/theme.ts
import { extendTheme, ThemeConfig } from '@chakra-ui/react'

const config: ThemeConfig = {
  initialColorMode: 'system',   // can be 'light' | 'dark' | 'system'
  useSystemColorMode: true,
}

const theme = extendTheme({ config })

export default theme
