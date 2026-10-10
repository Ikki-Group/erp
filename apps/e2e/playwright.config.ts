import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
	testDir: './tests',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	// reporter: 'html',
	// reporter: 'json',
	reporter: [
		// Mandatory reporter for JSON results
		['json', { outputFile: './playwright-report/report.json' }],
		// HTML reporter for better visualization
		['html', { outputFolder: './playwright-report/html', open: 'never' }],
	],
	// The test DB is a remote (Neon) database: under parallel load single requests
	// occasionally take several seconds, so the 5s default is too tight.
	expect: { timeout: 10_000 },
	use: {
		// Test web server started by scripts/test-e2e.sh (not the dev server on :3000).
		baseURL: process.env.BASE_URL ?? 'http://localhost:3100',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
	// webServer: {
	// 	command: 'bun run --cwd ../web dev',
	// 	url: 'http://localhost:3000',
	// 	reuseExistingServer: !process.env.CI,
	// 	timeout: 120000,
	// },
})
