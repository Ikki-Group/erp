import { test, expect } from '@playwright/test'

test('homepage loads successfully', async ({ page }) => {
	await page.goto('/')

	// Add your assertions here
	await expect(page).toHaveTitle(/IKKI ERP/)
})
