import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { SEED } from './test-data'

const ACTIVE_LOCATION_KEY = 'ikki-active-location-id'

/** The sr-only live region in the header: "Lokasi aktif: <name>". */
export function activeLocationStatus(page: Page) {
	return page.getByText(/^Lokasi aktif: /u)
}

/** Switch the active location through the header picker, like a user would. */
export async function switchLocation(page: Page, name: string): Promise<void> {
	const status = activeLocationStatus(page)
	const current = ((await status.textContent()) ?? '').replace('Lokasi aktif:', '').trim()
	// The picker trigger is labelled by the current location name.
	await page.getByRole('banner').getByRole('button', { name: current, exact: true }).click()
	await page.getByRole('menuitem', { name, exact: true }).click()
	await expect(status).toHaveText(`Lokasi aktif: ${name}`)
}

/**
 * Pre-select the active location before the app boots (it reads localStorage
 * once on load). Call before the first navigation.
 */
export async function presetLocation(page: Page, locationId: number | null): Promise<void> {
	await page.addInitScript(
		([key, id]) => {
			if (id === null) localStorage.removeItem(key)
			else localStorage.setItem(key, String(id))
		},
		[ACTIVE_LOCATION_KEY, locationId] as const,
	)
}

/** Assert a toast with this title appeared. */
export async function expectToast(page: Page, text: string | RegExp): Promise<void> {
	await expect(
		page.getByRole('region', { name: 'Notifications' }).getByRole('heading', { name: text }),
	).toBeVisible()
}

/**
 * Type into a list page's search box and wait for the debounced URL update,
 * so a following row click isn't overridden by the in-flight search navigation.
 */
export async function searchList(page: Page, placeholder: string, text: string): Promise<void> {
	await page.getByRole('searchbox', { name: placeholder }).fill(text)
	await expect(page).toHaveURL(new RegExp(`[?&]q=${encodeURIComponent(text)}(&|$)`, 'u'))
}

/** Pick an option from a Base UI select/combobox identified by its label. */
export async function pickOption(
	page: Page,
	label: string,
	option: string | RegExp,
): Promise<void> {
	await page.getByRole('combobox', { name: label, exact: true }).click()
	await page.getByRole('option', { name: option }).click()
}

/**
 * Create a draft goods receipt (1 line, `qty` pcs of the seeded pcs material)
 * at the currently active location. Ends on the new receipt's detail page.
 */
export async function createDraftReceiving(page: Page, qty = 10): Promise<string> {
	await page.goto('/inventory/receiving/new')
	await pickOption(page, 'Supplier', new RegExp(SEED.supplier, 'u'))
	await page.getByRole('button', { name: 'Lanjut' }).click()
	await page.getByRole('button', { name: 'Tambah Baris' }).click()
	await pickOption(page, 'Material', new RegExp(SEED.pcsMaterial, 'u'))
	await page.getByRole('textbox', { name: 'Jumlah' }).fill(String(qty))
	await pickOption(page, 'Satuan', /\(pcs\)/u)
	await page.getByRole('textbox', { name: 'Harga satuan' }).fill('5000')
	await page.getByRole('button', { name: 'Lanjut' }).click()
	await page.getByRole('button', { name: 'Simpan Penerimaan' }).click()
	await expect(page).toHaveURL(/\/inventory\/receiving\/\d+$/u)
	await expectToast(page, 'Penerimaan dibuat sebagai draft.')
	const heading = page.getByRole('heading', { level: 1, name: /^RCV-/u })
	await expect(heading).toBeVisible()
	return (await heading.textContent()) ?? ''
}
