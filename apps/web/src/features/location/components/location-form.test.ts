import { describe, expect, it } from 'vitest'

import type { LocationDto } from '../dto/index.ts'
import { EMPTY_LOCATION_FORM_VALUES, toLocationFormValues, toLocationInput } from './location-form'

const location: LocationDto = {
	id: 12,
	code: 'LOC-012',
	name: 'Kemang warehouse',
	type: 'warehouse',
	address: null,
	phone: null,
	isActive: false,
	createdAt: new Date('2026-01-01T00:00:00.000Z'),
	updatedAt: new Date('2026-01-02T00:00:00.000Z'),
	createdBy: null,
	updatedBy: null,
}

describe('location form mapping', () => {
	it('maps nullable contacts to editable strings without changing type or availability', () => {
		expect(toLocationFormValues(location)).toEqual({
			code: 'LOC-012',
			name: 'Kemang warehouse',
			type: 'warehouse',
			address: '',
			phone: '',
			isActive: false,
		})
	})

	it('trims identity and sends empty or whitespace-only contacts as null', () => {
		const values = {
			...EMPTY_LOCATION_FORM_VALUES,
			code: '  LOC-001  ',
			name: '  Kemang store  ',
			address: ' \t ',
			phone: '',
		}

		expect(toLocationInput(values)).toEqual({
			code: 'LOC-001',
			name: 'Kemang store',
			type: 'store',
			address: null,
			phone: null,
			isActive: true,
		})
		expect(values.code).toBe('  LOC-001  ')
		expect(values.address).toBe(' \t ')
	})

	it('preserves entered contacts and availability without leaking entity metadata', () => {
		const values = toLocationFormValues({
			...location,
			address: '  Jalan Kemang 12  ',
			phone: '  +62 21 1234  ',
		})

		expect(toLocationInput(values)).toEqual({
			code: 'LOC-012',
			name: 'Kemang warehouse',
			type: 'warehouse',
			address: 'Jalan Kemang 12',
			phone: '+62 21 1234',
			isActive: false,
		})
	})
})
