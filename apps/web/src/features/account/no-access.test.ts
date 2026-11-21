import { describe, expect, it } from 'vitest'

import { summarizeAccess } from './access-summary.ts'
import { hasNoAccess } from './no-access.ts'

const loc = { id: 1, code: 'KMG', name: 'Kemang', type: 'store' }

describe('hasNoAccess', () => {
	it('is true only without owner, location, or global grant', () => {
		expect(hasNoAccess({ isOwner: false, locations: [], globalPermissions: [] })).toBe(true)
		expect(hasNoAccess({ isOwner: true, locations: [], globalPermissions: [] })).toBe(false)
		expect(hasNoAccess({ isOwner: false, locations: [loc], globalPermissions: [] })).toBe(false)
		expect(hasNoAccess({ isOwner: false, locations: [], globalPermissions: ['iam.read'] })).toBe(
			false,
		)
	})
})

describe('summarizeAccess', () => {
	it('lists location roles and carries global roles to every location', () => {
		const role = (id: number, name: string) => ({ id, code: name, name })
		const summary = summarizeAccess(
			[loc],
			[
				{ id: 1, roleId: 1, locationId: 1, role: role(1, 'Manager'), location: loc },
				{ id: 2, roleId: 2, locationId: null, role: role(2, 'Auditor'), location: null },
			],
		)
		expect(summary.globalRoles).toEqual(['Auditor'])
		expect(summary.locations[0]?.roles).toEqual(['Manager', 'Auditor'])
	})
})
