import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Deployment: GitHub Pages auf eigener Domain (mathe.rosenbaum.hamburg) -> base '/'.
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    target: 'es2022',
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
