import { auditEntryOf } from '@/shared/audit/audit.port.ts'

import { describe, expect, test } from 'bun:test'

const actor = {
	id: 7,
	name: ' Owner ',
	locationId: 3,
}

describe('auditEntryOf', () => {
	test('builds an audit entry from the authenticated actor', () => {
		expect(
			auditEntryOf(actor, {
				module: 'inventory',
				entity: 'stock',
				entityId: 11,
				action: 'update',
				summary: 'Adjusted stock',
			}),
		).toEqual({
			actorId: 7,
			actorName: 'Owner',
			locationId: 3,
			module: 'inventory',
			entity: 'stock',
			entityId: 11,
			action: 'update',
			summary: 'Adjusted stock',
		})
	})

	test('rejects an actor without a name', () => {
		expect(() =>
			auditEntryOf(
				{ ...actor, name: ' ' },
				{
					module: 'inventory',
					entity: 'stock',
					entityId: 11,
					action: 'update',
					summary: 'Adjusted stock',
				},
			),
		).toThrow('Audit actor name is required')
	})
})
