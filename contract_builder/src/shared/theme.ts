// src/shared/theme.ts
import { extendTheme, ThemeConfig } from '@chakra-ui/react'

const config: ThemeConfig = {
  initialColorMode: 'system',   // can be 'light' | 'dark' | 'system'
  useSystemColorMode: true,
}

const theme = extendTheme({
  config,
  semanticTokens: {
    colors: {
      // Card backgrounds
      cardBg: {
        default: 'white',
        _dark: 'gray.800',
      },
      cardBgAlt: {
        default: 'gray.50',
        _dark: 'gray.700',
      },
      
      // Borders
      border: {
        default: 'gray.200',
        _dark: 'gray.700',
      },
      borderAlt: {
        default: 'gray.200',
        _dark: 'gray.600',
      },
      
      // Text colors
      textPrimary: {
        default: 'gray.900',
        _dark: 'gray.100',
      },
      textSecondary: {
        default: 'gray.700',
        _dark: 'gray.300',
      },
      textMuted: {
        default: 'gray.600',
        _dark: 'gray.400',
      },
      
      // Status colors
      success: {
        default: 'green.600',
        _dark: 'green.400',
      },
      error: {
        default: 'red.600',
        _dark: 'red.400',
      },
      warning: {
        default: 'orange.600',
        _dark: 'orange.400',
      },
      info: {
        default: 'blue.600',
        _dark: 'blue.400',
      },
      
      // Payment status colors
      paid: {
        default: 'green.500',
        _dark: 'green.400',
      },
      unpaid: {
        default: 'red.500',
        _dark: 'red.400',
      },
      deposit: {
        default: 'yellow.600',
        _dark: 'yellow.400',
      },
      
      // Background colors
      bgHover: {
        default: 'gray.50',
        _dark: 'gray.700',
      },
      bgStaff: {
        default: 'green.50',
        _dark: 'green.900',
      },
      bgAdmin: {
        default: 'blue.50',
        _dark: 'blue.900',
      },
      
      // Info section colors
      infoBg: {
        default: 'blue.50',
        _dark: 'blue.900',
      },
      infoTitle: {
        default: 'blue.800',
        _dark: 'blue.100',
      },
      infoText: {
        default: 'blue.700',
        _dark: 'blue.200',
      },
      infoLink: {
        default: 'blue.500',
        _dark: 'blue.300',
      },
      
      // Table headers
      tableHeader: {
        default: 'gray.50',
        _dark: 'gray.800',
      },
      
      // Tooltip colors
      tooltipBg: {
        default: 'white',
        _dark: 'gray.700',
      },
      tooltipText: {
        default: 'gray.800',
        _dark: 'white',
      },
      
      // Dive dashboard specific colors
      wildlifePeak: {
        default: 'green.50',
        _dark: 'green.900',
      },
      wildlifeLow: {
        default: 'orange.50',
        _dark: 'orange.900',
      },
      temperatureInsights: {
        default: 'orange.50',
        _dark: 'orange.900',
      },
      speciesDiversity: {
        default: 'blue.50',
        _dark: 'blue.900',
      },
    },
  },
})

export default theme
