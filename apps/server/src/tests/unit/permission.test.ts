import { allowedLocations, assertCan, can, permissionsAt } from '@/shared/auth/permission.ts'
import type { AuthContext } from '@/shared/auth/permission.ts'
import { ForbiddenError } from '@/shared/errors/http-error.ts'

import { describe, expect, test } from 'bun:test'

// ─── Fixtures ───

const base = { sessionId: 's', userName: 'User', locationId: 1, globalPermissions: [], access: {} }

const owner: AuthContext = { ...base, userId: 1, isOwner: true }

/** Cashier at store 1, warehouse staff at location 2. */
const multi: AuthContext = {
	...base,
	userId: 2,
	isOwner: false,
	access: { '1': ['order.create', 'stock.read'], '2': ['stock.read', 'receiving.confirm'] },
}

/** Global auditor plus a store-only role. */
const auditor: AuthContext = {
	...base,
	userId: 3,
	isOwner: false,
	globalPermissions: ['audit.read'],
	access: { '1': ['order.create'] },
}

// ─── can ───

describe('can', () => {
	test('owner holds every permission everywhere, including globally', () => {
		expect(can(owner, 'anything.at.all', null)).toBe(true)
		expect(can(owner, 'anything.at.all', 99)).toBe(true)
	})

	test('a location grant holds only at that location', () => {
		expect(can(multi, 'order.create', 1)).toBe(true)
		expect(can(multi, 'order.create', 2)).toBe(false)
		expect(can(multi, 'receiving.confirm', 2)).toBe(true)
		expect(can(multi, 'receiving.confirm', 1)).toBe(false)
	})

	test('location grants never satisfy a global (null) check', () => {
		expect(can(multi, 'stock.read', null)).toBe(false)
	})

	test('a global grant holds at every location and globally', () => {
		expect(can(auditor, 'audit.read', null)).toBe(true)
		expect(can(auditor, 'audit.read', 42)).toBe(true)
	})

	test('auth utility permissions need no grant', () => {
		expect(can({ ...multi, access: {} }, 'auth.me', null)).toBe(true)
	})
})

// ─── allowedLocations ───

describe('allowedLocations', () => {
	test('null (unrestricted) for owner and global grants', () => {
		expect(allowedLocations(owner, 'stock.read')).toBeNull()
		expect(allowedLocations(auditor, 'audit.read')).toBeNull()
	})

	test('exactly the locations granting the permission', () => {
		expect(allowedLocations(multi, 'stock.read')?.toSorted()).toEqual([1, 2])
		expect(allowedLocations(multi, 'receiving.confirm')).toEqual([2])
	})

	test('empty when no location grants it', () => {
		expect(allowedLocations(multi, 'transfer.ship')).toEqual([])
	})
})

// ─── permissionsAt ───

describe('permissionsAt', () => {
	test('merges global with the location grants, without duplicates', () => {
		expect(permissionsAt(auditor, 1).toSorted()).toEqual(['audit.read', 'order.create'])
		expect(permissionsAt(auditor, null)).toEqual(['audit.read'])
	})
})

// ─── assertCan ───

describe('assertCan', () => {
	test('throws PERMISSION_DENIED naming the permission and location', () => {
		try {
			assertCan(multi, 'order.create', 2)
			expect.unreachable('should have thrown')
		} catch (error) {
			expect(error).toBeInstanceOf(ForbiddenError)
			const err = error as ForbiddenError
			expect(err.code).toBe('PERMISSION_DENIED')
			expect(err.context).toEqual({ required: 'order.create', locationId: 2 })
			expect(err.statusCode).toBe(403)
		}
	})
})
