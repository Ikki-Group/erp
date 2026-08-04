/**
 * Unit tests for IamComposedService — the cross-submodule aggregation layer.
 *
 * Runs WITHOUT a database. The composed service depends on sibling services and
 * its own repo port (`IIamComposedRepo`); we pass typed fakes. This covers the
 * global-scope role access detection and the dangling-FK guard for normal users.
 */

import type { WithPaginationResult } from '@/shared/types/pagination'
import { RelationMap } from '@/shared/utils'

import type { UserAssignmentDto } from '@/modules/iam/assignment/assignment.contract'
import type { UserFilterDto } from '@/modules/iam/composed/composed.contract'
import type { IIamComposedRepo } from '@/modules/iam/composed/composed.repo'
import { IamComposedService } from '@/modules/iam/composed/composed.service'
import type { RoleDto } from '@/modules/iam/role/role.contract'
import type { UserDto } from '@/modules/iam/user/user.contract'
import type { LocationSchema } from '@/modules/location'

import { describe, expect, test } from 'bun:test'

/** Assert that a promise rejects (type-aware-lint friendly alternative to `.rejects`). */
async function expectReject(promise: Promise<unknown>): Promise<void> {
	let threw = false
	try {
		await promise
	} catch {
		threw = true
	}
	expect(threw).toBe(true)
}

const OWNER_ROLE: RoleDto = {
	id: 1,
	code: 'OWNER',
	name: 'Owner',
	description: null,
	scope: 'global',
	permissions: ['*'],
	isSystem: true,
	createdBy: 1,
	updatedBy: 1,
	createdAt: new Date(),
	updatedAt: new Date(),
}

const STAFF_ROLE: RoleDto = {
	...OWNER_ROLE,
	id: 2,
	code: 'STAFF',
	name: 'Staff',
	scope: 'location',
	permissions: [],
	isSystem: false,
}

const LOCATION_1: LocationSchema = {
	id: 10,
	code: 'WH-1',
	name: 'Warehouse',
	type: 'warehouse',
	description: null,
	address: null,
	phone: null,
	isActive: true,
	createdBy: 1,
	updatedBy: 1,
	createdAt: new Date(),
	updatedAt: new Date(),
}

function makeUser(overrides: Partial<UserDto> = {}): UserDto {
	return {
		id: 100,
		email: 'u@ikki.com',
		username: 'u',
		fullname: 'User',
		pinCode: null,
		isActive: true,
		defaultLocationId: null,
		createdBy: 1,
		updatedBy: 1,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}
}

/** Build a composed service with fake deps + repo. `assignmentsByUser` maps userId → assignments. */
function buildService(opts: {
	users: UserDto[]
	assignmentsByUser?: Record<number, UserAssignmentDto[]>
	roles?: RoleDto[]
	locations?: LocationSchema[]
}) {
	const roles = opts.roles ?? [OWNER_ROLE, STAFF_ROLE]
	const locations = opts.locations ?? [LOCATION_1]
	const assignmentsByUser = opts.assignmentsByUser ?? {}

	const deps = {
		assignment: {
			getRecordByUserId: async (_ids: number[]) => assignmentsByUser,
		},
		role: {
			getAll: async () => roles,
			toRelationMap: (r: RoleDto[]) => RelationMap.fromArray(r, (x) => x.id),
		},
		location: {
			getListAll: async () => locations,
			toRelationMap: (l: LocationSchema[]) => RelationMap.fromArray(l, (x) => x.id),
		},
		user: {
			getById: async (id: number) => opts.users.find((u) => u.id === id),
		},
	}

	const repo: IIamComposedRepo = {
		db: {} as never,
		getListPaginated: async (filter: UserFilterDto): Promise<WithPaginationResult<UserDto>> => {
			const limit = filter.limit ?? 10
			return {
				data: opts.users,
				meta: {
					total: opts.users.length,
					page: filter.page ?? 1,
					limit,
					totalPages: Math.max(1, Math.ceil(opts.users.length / limit)),
				},
			}
		},
	}

	// deps are typed as concrete service classes; the fake provides only the
	// methods composed actually calls, so a localized cast is required.
	return new IamComposedService(deps as never, repo)
}

describe('IamComposedService (unit)', () => {
	test('user with global-scoped role has hasGlobalAccess = true', async () => {
		const service = buildService({
			users: [makeUser({ id: 1 })],
			assignmentsByUser: {
				1: [
					{
						id: 1,
						userId: 1,
						roleId: OWNER_ROLE.id,
						locationId: 10,
						addedAt: new Date(),
						addedBy: 1,
					},
				],
			},
		})

		const result = await service.getListPaginated({ page: 1, limit: 10, q: undefined })

		expect(result.data).toHaveLength(1)
		expect(result.data[0]!.hasGlobalAccess).toBe(true)
		expect(result.data[0]!.assignments).toHaveLength(1)
		expect(result.data[0]!.assignments[0]!.role.code).toBe('OWNER')
		expect(result.data[0]!.assignments[0]!.location.id).toBe(LOCATION_1.id)
	})

	test('normal user maps real assignments through the relation maps', async () => {
		const service = buildService({
			users: [makeUser({ id: 100 })],
			assignmentsByUser: {
				100: [{ id: 1, userId: 100, roleId: 2, locationId: 10, addedAt: new Date(), addedBy: 1 }],
			},
		})

		const result = await service.getListPaginated({ page: 1, limit: 10, q: undefined })

		expect(result.data[0]!.hasGlobalAccess).toBe(false)
		expect(result.data[0]!.assignments).toHaveLength(1)
		expect(result.data[0]!.assignments[0]!.role.code).toBe('STAFF')
		expect(result.data[0]!.assignments[0]!.location.id).toBe(10)
	})

	test('dangling FK (missing role/location) is skipped, not fatal', async () => {
		const service = buildService({
			users: [makeUser({ id: 100 })],
			assignmentsByUser: {
				// roleId 999 does not exist in the roles map → must be skipped
				100: [{ id: 1, userId: 100, roleId: 999, locationId: 10, addedAt: new Date(), addedBy: 1 }],
			},
		})

		const result = await service.getListPaginated({ page: 1, limit: 10, q: undefined })

		expect(result.data).toHaveLength(1)
		expect(result.data[0]!.assignments).toHaveLength(0) // degraded gracefully
	})

	test('getDetailById throws when user is missing', async () => {
		const service = buildService({ users: [] })
		await expectReject(service.getDetailById(404))
	})
})
