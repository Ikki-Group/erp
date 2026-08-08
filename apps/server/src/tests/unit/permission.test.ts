import { describe, expect, test } from 'bun:test'

import { ForbiddenError } from '@/shared/errors/http-error.ts'

import {
	hasPermission,
	requireAnyPermission,
	requirePermission,
} from '@/shared/auth/permission.ts'
import type { AuthContext } from '@/shared/auth/permission.ts'

// ─── Fixtures ───

const owner: AuthContext = {
	userId: 1,
	locationId: 1,
	permissions: [],
	isOwner: true,
}

const cashier: AuthContext = {
	userId: 2,
	locationId: 1,
	permissions: ['pos.order.create', 'pos.order.complete', 'pos.shift.open'],
	isOwner: false,
}

const noPerms: AuthContext = {
	userId: 3,
	locationId: 1,
	permissions: [],
	isOwner: false,
}

// ─── hasPermission ───

describe('hasPermission', () => {
	test('owner always has any permission', () => {
		expect(hasPermission(owner, 'pos.order.create')).toBe(true)
		expect(hasPermission(owner, 'admin.delete.everything')).toBe(true)
		expect(hasPermission(owner, 'nonexistent.permission')).toBe(true)
	})

	test('returns true when user has the permission', () => {
		expect(hasPermission(cashier, 'pos.order.create')).toBe(true)
		expect(hasPermission(cashier, 'pos.shift.open')).toBe(true)
	})

	test('returns false when user lacks the permission', () => {
		expect(hasPermission(cashier, 'inventory.receiving.confirm')).toBe(false)
		expect(hasPermission(cashier, 'admin.users.manage')).toBe(false)
	})

	test('returns false for user with no permissions', () => {
		expect(hasPermission(noPerms, 'pos.order.create')).toBe(false)
	})
})

// ─── requirePermission ───

describe('requirePermission', () => {
	test('does not throw for owner', () => {
		expect(() => requirePermission(owner, 'anything')).not.toThrow()
	})

	test('does not throw when user has permission', () => {
		expect(() => requirePermission(cashier, 'pos.order.create')).not.toThrow()
	})

	test('throws ForbiddenError when user lacks permission', () => {
		expect(() => requirePermission(cashier, 'inventory.receiving.confirm')).toThrow(ForbiddenError)
	})

	test('thrown error has correct code and context', () => {
		try {
			requirePermission(noPerms, 'admin.users.manage')
			expect.unreachable('should have thrown')
		} catch (e) {
			expect(e).toBeInstanceOf(ForbiddenError)
			const err = e as ForbiddenError
			expect(err.code).toBe('PERMISSION_DENIED')
			expect(err.context).toEqual({ required: 'admin.users.manage' })
			expect(err.statusCode).toBe(403)
		}
	})
})

// ─── requireAnyPermission ───

describe('requireAnyPermission', () => {
	test('does not throw for owner regardless of permissions', () => {
		expect(() => requireAnyPermission(owner, ['nonexistent.a', 'nonexistent.b'])).not.toThrow()
	})

	test('does not throw when user has at least one permission', () => {
		expect(() =>
			requireAnyPermission(cashier, ['inventory.stock.view', 'pos.order.create']),
		).not.toThrow()
	})

	test('throws when user has none of the required permissions', () => {
		expect(() =>
			requireAnyPermission(cashier, ['inventory.receiving.confirm', 'admin.users.manage']),
		).toThrow(ForbiddenError)
	})

	test('thrown error includes requiredAny in context', () => {
		const required = ['admin.a', 'admin.b']
		try {
			requireAnyPermission(noPerms, required)
			expect.unreachable('should have thrown')
		} catch (e) {
			const err = e as ForbiddenError
			expect(err.code).toBe('PERMISSION_DENIED')
			expect(err.context).toEqual({ requiredAny: required })
		}
	})
})
