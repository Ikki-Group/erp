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
		// Optional, enables native HTML upload
		// ['html', { outputDir: './playwright-report' }],
	],
	use: {
		baseURL: 'http://localhost:3000',
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
