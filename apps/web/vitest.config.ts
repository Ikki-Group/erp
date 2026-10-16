import { defineConfig } from 'vitest/config'

/**
 * Vitest config for `apps/web`. Kept separate from `vite.config.ts` (the app
 * build) so unit tests don't drag in the router/tailwind/devtools plugins.
 *
 * Tests are colocated with source as `*.test.ts(x)`. Node environment is the
 * default; suites needing a DOM opt in per-file via
 * `// @vitest-environment jsdom`.
 */
export default defineConfig({
	resolve: {
		alias: {
			'@': new URL('./src', import.meta.url).pathname,
		},
	},
	test: {
		globals: true,
		// Keep DOM suites responsive on shared machines; worker contention can exhaust test timeouts.
		maxWorkers: 2,
		include: ['src/**/*.test.{ts,tsx}'],
	},
})
