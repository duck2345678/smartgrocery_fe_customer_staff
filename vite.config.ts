import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      include: [
        'app/(staff)/**/*.{ts,tsx}',
        'src/components/ui/**/*.{ts,tsx}',
        'src/store/staff*Store.ts',
        'src/utils/loginValidation.ts',
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
