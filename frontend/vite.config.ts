/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react')) return 'vendor'
          if (id.includes('node_modules/react-dom')) return 'vendor'
          if (id.includes('node_modules/react-router-dom')) return 'vendor'
          if (id.includes('node_modules/firebase')) return 'firebase'
          if (id.includes('node_modules/@firebase')) return 'firebase'
          if (id.includes('node_modules/recharts')) return 'charts'
          return undefined
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    exclude: ['e2e/**/*', 'node_modules/**/*'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test-setup.ts',
        'src/vite-env.d.ts',
        'src/main.tsx',
        'src/types/',
        'src/__tests__/',
        'e2e/',
        '*.config.js',
        '*.config.ts',
        'src/firebase.ts',
        'src/services/analytics.ts',
        'src/services/api.ts',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        statements: 70,
        branches: 65,
      },
    },
  },
})
