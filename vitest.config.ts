import { defineConfig } from 'vitest/config';
import path from 'path';

const cyberchefDir = path.resolve(__dirname, '../CyberChef');

export default defineConfig({
  resolve: {
    alias: {
      '@cyberchef': path.resolve(cyberchefDir, 'src/core'),
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    globals: true,
  },
});
