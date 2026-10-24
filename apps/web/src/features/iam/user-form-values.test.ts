import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import type { UserDetailDto } from './dto'
import {
	emptyUserFormValues,
	toUserAssignments,
	toUserCreateInput,
	toUserFormValues,
	toUserUpdateInput,
	userFormSchema,
} from './user-form-values'
import type { UserFormValues } from './user-form-values'

const user: UserDetailDto = {
	id: 9,
	username: 'jane',
	email: 'jane@example.com',
	name: 'Jane',
	isActive: false,
	createdAt: new Date('2026-01-01T00:00:00Z'),
	updatedAt: new Date('2026-01-01T00:00:00Z'),
	createdBy: null,
	updatedBy: null,
	assignments: [
		{
			id: 8,
			roleId: 125,
			locationId: 20,
			role: { id: 125, code: 'R-125', name: 'Role 125' },
			location: { id: 20, code: 'L-20', name: 'Location 20' },
		},
	],
}
const validValues: UserFormValues = {
	...emptyUserFormValues(),
	username: ' jane ',
	email: ' jane@example.com ',
	name: ' Jane ',
	password: 'password123',
	assignments: [{ clientKey: 'row-a', roleId: 1, locationId: null }],
}

afterEach(() => vi.restoreAllMocks())

describe('user form mapping', () => {
	it('maps loaded details without a password and gives each row a client-only identity', () => {
		vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000001')
		expect(toUserFormValues(user)).toEqual({
			username: 'jane',
			email: 'jane@example.com',
			name: 'Jane',
			password: '',
			isActive: false,
			assignmentMode: 'per_location',
			assignments: [
				{ clientKey: '00000000-0000-4000-8000-000000000001', roleId: 125, locationId: 20 },
			],
		})
		expect(toUserFormValues({ ...user, assignments: [] }).assignmentMode).toBe('global')
	})

	it('trims account input and excludes password from updates and client keys from all wire inputs', () => {
		expect(toUserCreateInput(validValues)).toEqual({
			username: 'jane',
			email: 'jane@example.com',
			name: 'Jane',
			password: 'password123',
			isActive: true,
		})
		expect(toUserUpdateInput(9, validValues)).toEqual({
			id: 9,
			username: 'jane',
			email: 'jane@example.com',
			name: 'Jane',
			isActive: true,
		})
		expect(toUserAssignments(validValues)).toEqual([{ roleId: 1, locationId: null }])
		expect(validValues.assignments[0]?.clientKey).toBe('row-a')
	})

	it('maps selected-location scope with actual IDs and permits the same role in different locations', () => {
		const input: UserFormValues = {
			...validValues,
			assignmentMode: 'per_location',
			assignments: [
				{ clientKey: 'row-a', roleId: 1, locationId: 10 },
				{ clientKey: 'row-b', roleId: 1, locationId: 20 },
			],
		}
		expect(toUserAssignments(input)).toEqual([
			{ roleId: 1, locationId: 10 },
			{ roleId: 1, locationId: 20 },
		])
	})

	it('rejects unresolved roles with a friendly field issue and never maps sentinel zero', () => {
		const unresolved = {
			...validValues,
			assignments: [{ clientKey: 'row-a', roleId: null, locationId: null }],
		}
		const parsed = userFormSchema('create').safeParse(unresolved)
		expect(parsed.success).toBe(false)
		if (parsed.success) throw new Error('Expected role validation')
		expect(parsed.error.issues).toContainEqual(
			expect.objectContaining({
				path: ['assignments', 0, 'roleId'],
				message: 'Select a role for this assignment.',
			}),
		)
		expect(() => toUserAssignments(unresolved)).toThrow('Select a role')
		expect(() =>
			toUserAssignments({
				...validValues,
				assignments: [{ clientKey: 'row-a', roleId: 0, locationId: null }],
			}),
		).toThrow(z.ZodError)
	})

	it('rejects mixed scope, missing locations, duplicate global roles and duplicate locations', () => {
		expect(() =>
			toUserAssignments({
				...validValues,
				assignments: [{ clientKey: 'row-a', roleId: 1, locationId: 10 }],
			}),
		).toThrow('Global access cannot include a location')
		expect(() => toUserAssignments({ ...validValues, assignmentMode: 'per_location' })).toThrow(
			'Select a location',
		)
		expect(() =>
			toUserAssignments({
				...validValues,
				assignments: [
					{ clientKey: 'row-a', roleId: 1, locationId: null },
					{ clientKey: 'row-b', roleId: 1, locationId: null },
				],
			}),
		).toThrow('already assigned globally')
		expect(() =>
			toUserAssignments({
				...validValues,
				assignmentMode: 'per_location',
				assignments: [
					{ clientKey: 'row-a', roleId: 1, locationId: 10 },
					{ clientKey: 'row-b', roleId: 2, locationId: 10 },
				],
			}),
		).toThrow('Each location can only be assigned once')
	})

	it('requires a password only for creation', () => {
		expect(userFormSchema('create').safeParse({ ...validValues, password: '' }).success).toBe(false)
		expect(userFormSchema('edit').safeParse({ ...validValues, password: '' }).success).toBe(true)
	})
})
