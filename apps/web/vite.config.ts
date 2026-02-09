import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackRouter } from '@tanstack/router-vite-plugin'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'

const config = defineConfig({
  plugins: [
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
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
