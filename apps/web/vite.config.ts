import { sentryVitePlugin } from '@sentry/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackRouter } from '@tanstack/router-vite-plugin'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import viteTsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig((c) => {
  const isDev = c.command === 'serve'
  return {
    plugins: [
      sentryVitePlugin({
        telemetry: !isDev,
        org: Bun.env.SENTRY_ORG,
        project: Bun.env.SENTRY_PROJECT,
        authToken: Bun.env.SENTRY_AUTH_TOKEN,
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
    server: { allowedHosts: ['mba.local', 'localhost', '127.0.0.1', '::1', '0.0.0.0'] },
  }
})
