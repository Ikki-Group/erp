import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackRouter } from '@tanstack/router-vite-plugin'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  plugins: [
    devtools(),
    tanstackRouter({
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
      autoCodeSplitting: true,
      routeFileIgnorePrefix: '-',
    }),
    viteTsConfigPaths(),
    tailwindcss({ optimize: true }),
    viteReact(),
  ],
  server: {
    allowedHosts: ['mba.local', 'localhost', '127.0.0.1', '::1', '0.0.0.0'],
  },
})

export default config
