import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      include: [
        'src/components/ui/PhotoCaptureFlow.tsx',
        'src/utils/homeUtils.ts',
        'src/utils/loginValidation.ts',
        'src/utils/staffPickingUtils.ts',
      ],
      exclude: [
        '**/*.d.ts',
        '**/*.test.*',
        '**/node_modules/**',
        '**/coverage/**',
        '**/.expo/**',
        'src/api/**',
      ],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
})
