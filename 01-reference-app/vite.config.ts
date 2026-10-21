/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Unit tests live next to the code; the handover kit's port tests run in the host repo.
  test: { include: ['src/**/*.test.ts'] },
})
