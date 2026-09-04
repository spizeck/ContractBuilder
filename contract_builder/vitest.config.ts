/// <reference types="vitest" />
import path from 'path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'tests/**/*.{test,spec}.{ts,tsx}'],
    alias: {
      '@/': path.resolve(__dirname, 'src') + '/',
      '@core/': path.resolve(__dirname, 'src/core') + '/',
      '@shared/': path.resolve(__dirname, 'src/shared') + '/',
    },
  },
})
