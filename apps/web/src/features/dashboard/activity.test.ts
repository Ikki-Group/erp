import { describe, expect, it } from 'vitest'

import { humanizeActivity, isOperationalActivity } from './activity.ts'

const base = { userName: 'Budi', module: 'material', entity: 'material', action: 'create' }

describe('humanizeActivity', () => {
	it('reads a quoted name and drops the code/ids', () => {
		expect(
			humanizeActivity({ ...base, summary: 'Created material "Kopi Arabika" (MAT-001)' }),
		).toEqual({
			actor: 'Budi',
			verb: 'membuat',
			entity: 'material',
			subject: { text: 'Kopi Arabika', code: false },
		})
	})

	it('falls back to a document number', () => {
		const line = humanizeActivity({
			...base,
			module: 'inventory',
			entity: 'transfer_request',
			action: 'ship',
			summary: 'Shipped transfer TRF-STORE-01-0003',
		})
		expect(line).toMatchObject({
			verb: 'mengirim',
			entity: 'transfer',
			subject: { text: 'TRF-STORE-01-0003', code: true },
		})
	})

	it('disambiguates module-scoped entities and tolerates unknown ones', () => {
		expect(
			humanizeActivity({ ...base, module: 'production', entity: 'order', summary: 'x' }).entity,
		).toBe('order produksi')
		expect(
			humanizeActivity({ ...base, entity: 'new_thing', action: 'archive', summary: 'Archived #4' }),
		).toMatchObject({ verb: 'archive', entity: 'new thing', subject: null })
	})
})

describe('isOperationalActivity', () => {
	it('excludes every pos-* module', () => {
		expect(isOperationalActivity({ module: 'pos-order' })).toBe(false)
		expect(isOperationalActivity({ module: 'pos-shift' })).toBe(false)
		expect(isOperationalActivity({ module: 'inventory' })).toBe(true)
	})
})
