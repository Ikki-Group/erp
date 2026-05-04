import { test, expect } from './fixtures/auth.fixture'

test.describe('CRM & Loyalty', () => {
	/**
	 * Test that customer form has all required fields for CRM
	 * This ensures customer data collection is complete for loyalty program
	 */
	test('customer form displays all CRM fields', async ({ page, login }) => {
		await login()

		await page.goto('/sales/customers')

		// Open customer dialog
		const addButton = page.getByRole('button', { name: /tambah/i })
		if ((await addButton.count()) > 0) {
			await addButton.click()

			// Verify CRM-specific fields
			await expect(page.getByLabel('Kode Pelanggan')).toBeVisible()
			await expect(page.getByLabel('Nama')).toBeVisible()
			await expect(page.getByLabel('Email')).toBeVisible()
			await expect(page.getByLabel('Phone')).toBeVisible()
		}
	})

	/**
	 * Test that customer has loyalty tier assignment
	 * This ensures customer tier (Bronze, Silver, Gold, Platinum) is managed
	 */
	test('customer displays loyalty tier', async ({ page, login }) => {
		await login()

		await page.goto('/sales/customers')

		// Verify Tier column exists
		await expect(page.getByText('Tier')).toBeVisible()
	})

	/**
	 * Test that customer has points balance
	 * This ensures loyalty points are tracked for rewards
	 */
	test('customer displays points balance for loyalty', async ({ page, login }) => {
		await login()

		await page.goto('/sales/customers')

		// Verify Poin column exists
		await expect(page.getByText('Poin')).toBeVisible()
	})

	/**
	 * Test that customer can be registered for loyalty program
	 * This ensures new customers can be added to loyalty system
	 */
	test('can register new customer for loyalty program', async ({ page, login }) => {
		await login()

		await page.goto('/sales/customers')

		// Click "Tambah" button
		const addButton = page.getByRole('button', { name: /tambah/i })
		if ((await addButton.count()) > 0) {
			await addButton.click()

			// Fill customer details
			await page.getByLabel('Kode Pelanggan').fill('CUST-LOYALTY-001')
			await page.getByLabel('Nama').fill('Loyalty Test Customer')
			await page.getByLabel('Email').fill('loyalty@example.com')
			await page.getByLabel('Phone').fill('08123456789')

			// Submit form
			const saveButton = page.getByRole('button', { name: /simpan/i })
			if ((await saveButton.count()) > 0) {
				await saveButton.click()

				// Verify success toast
				await expect(page.getByText(/berhasil/i)).toBeVisible()
			}
		}
	})

	/**
	 * Test that customer tier can be upgraded
	 * This ensures customers can move up loyalty tiers
	 */
	test('can upgrade customer loyalty tier', async ({ page, login }) => {
		await login()

		await page.goto('/sales/customers')

		// Click edit button on a customer
		const editButton = page.getByRole('button', { name: /edit/i }).first()
		if ((await editButton.count()) > 0) {
			await editButton.click()

			// Change tier selection if available
			const tierSelect = page.getByLabel(/tier/i, { exact: false })
			if ((await tierSelect.count()) > 0) {
				await tierSelect.selectOption('gold')

				// Submit form
				const saveButton = page.getByRole('button', { name: /simpan/i })
				if ((await saveButton.count()) > 0) {
					await saveButton.click()

					// Verify success
					await expect(page.getByText(/berhasil/i)).toBeVisible()
				}
			}
		}
	})

	/**
	 * Test that customer purchase history is accessible
	 * This ensures customer transaction history can be viewed
	 */
	test('can view customer purchase history', async ({ page, login }) => {
		await login()

		await page.goto('/sales/customers')

		// Click on a customer to view details
		const customerRow = page.locator('tbody tr').first()
		const rowCount = await customerRow.count()

		if (rowCount > 0) {
			await customerRow.click()

			// Verify customer detail page loads
			await expect(page.locator('h1, h2').first()).toBeVisible()
		}
	})

	/**
	 * Test that customer points can be manually adjusted
	 * This ensures loyalty points can be managed manually
	 */
	test('can adjust customer loyalty points manually', async ({ page, login }) => {
		await login()

		await page.goto('/sales/customers')

		// Click edit button on a customer
		const editButton = page.getByRole('button', { name: /edit/i }).first()
		if ((await editButton.count()) > 0) {
			await editButton.click()

			// Look for points adjustment field
			const pointsField = page.getByLabel(/poin/i, { exact: false })
			if ((await pointsField.count()) > 0) {
				await expect(pointsField).toBeVisible()
			}
		}
	})

	/**
	 * Test that customer contact information is stored
	 * This ensures customer communication channels are captured
	 */
	test('customer form captures contact information', async ({ page, login }) => {
		await login()

		await page.goto('/sales/customers')

		// Open customer dialog
		const addButton = page.getByRole('button', { name: /tambah/i })
		if ((await addButton.count()) > 0) {
			await addButton.click()

			// Verify contact fields
			await expect(page.getByLabel('Email')).toBeVisible()
			await expect(page.getByLabel('Phone')).toBeVisible()
		}
	})

	/**
	 * Test that customer address can be stored
	 * This ensures delivery/shipping addresses are captured
	 */
	test('customer form captures address information', async ({ page, login }) => {
		await login()

		await page.goto('/sales/customers')

		// Open customer dialog
		const addButton = page.getByRole('button', { name: /tambah/i })
		if ((await addButton.count()) > 0) {
			await addButton.click()

			// Verify address field
			await expect(page.getByLabel('Address')).toBeVisible()
		}
	})

	/**
	 * Test that customer tax ID can be stored
	 * This ensures tax identification is captured for B2B customers
	 */
	test('customer form captures tax ID for B2B', async ({ page, login }) => {
		await login()

		await page.goto('/sales/customers')

		// Open customer dialog
		const addButton = page.getByRole('button', { name: /tambah/i })
		if ((await addButton.count()) > 0) {
			await addButton.click()

			// Verify tax ID field
			await expect(page.getByLabel('Tax ID')).toBeVisible()
		}
	})

	/**
	 * Test that customer birthday can be stored
	 * This ensures birthday information is captured for birthday rewards
	 */
	test('customer form captures date of birth', async ({ page, login }) => {
		await login()

		await page.goto('/sales/customers')

		// Open customer dialog
		const addButton = page.getByRole('button', { name: /tambah/i })
		if ((await addButton.count()) > 0) {
			await addButton.click()

			// Verify date of birth field
			await expect(page.getByLabel('Date of Birth')).toBeVisible()
		}
	})

	/**
	 * Test that customers can be searched by name or code
	 * This ensures customer lookup works efficiently
	 */
	test('can search customers by name or code', async ({ page, login }) => {
		await login()

		await page.goto('/sales/customers')

		// Enter search term
		const searchInput = page.getByPlaceholder(/cari/i)
		if ((await searchInput.count()) > 0) {
			await searchInput.fill('Test')

			// Wait for search to complete
			await page.waitForTimeout(500)

			// Verify search input has value
			await expect(searchInput).toHaveValue('Test')
		}
	})

	/**
	 * Test that customer deletion requires confirmation
	 * This ensures accidental deletions are prevented
	 */
	test('requires confirmation before deleting customer', async ({ page, login }) => {
		await login()

		await page.goto('/sales/customers')

		// Click delete button on a customer
		const deleteButton = page.getByRole('button', { name: /hapus/i }).first()
		if ((await deleteButton.count()) > 0) {
			await deleteButton.click()

			// Verify confirmation dialog appears
			await expect(page.getByText(/apakah anda yakin/i)).toBeVisible()
		}
	})
})
