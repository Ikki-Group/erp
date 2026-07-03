import type { RoleService, UserService } from '@/modules/iam'
import type { IamModule } from '@/modules/iam/iam.module'

import { testCtx } from '../setup'
import { describe, test, expect, beforeAll } from 'bun:test'

function createMockUser(suffix: string): Parameters<UserService['handleCreate']>[0] {
	return {
		email: `test-svc-${suffix}@ikki.com`,
		username: `test-svc-${suffix}`,
		fullname: `Test User Svc ${suffix}`,
		password: 'password12345',
		isActive: true,
		isRoot: true,
		pinCode: '1234',
		defaultLocationId: null,
		assignments: [],
	}
}

function createMockRole(suffix: string): Parameters<RoleService['handleCreate']>[0] {
	return {
		code: `TEST_ROLE_${suffix}`,
		name: `Test Role ${suffix}`,
		description: 'Test Description',
		permissions: ['iam.user.read'],
		isSystem: false,
	}
}

describe('services/iam', () => {
	let iamSvc: IamModule
	const run = Date.now().toString(36)

	beforeAll(() => {
		iamSvc = testCtx.m.iam
	})

	test('role CRUD', async () => {
		const mockRole = createMockRole(`crud-${run}`)

		const created = await iamSvc.role.handleCreate(mockRole, 1)
		expect(created.id).toBeDefined()

		const detail = await iamSvc.role.handleGetById(created.id)
		expect(detail.id).toBe(created.id)

		const updated = await iamSvc.role.handleUpdate(
			{ id: created.id, ...mockRole, name: `${mockRole.name} updated` },
			1,
		)
		expect(updated.id).toBe(created.id)

		const list = await iamSvc.role.handleList({ q: detail.name, limit: 10, page: 1 })
		expect(
			list.data.some((r) => r.code === detail.code),
			`Role ${detail.code} not found`,
		).toBe(true)

		const removed = await iamSvc.role.handleDelete(updated.id)
		expect(removed.id).toBe(updated.id)
	})

	test('user CRUD (isRoot)', async () => {
		const mockUser = createMockUser(`crud-isroot-${run}`)

		const created = await iamSvc.user.handleCreate(mockUser, 1)
		expect(created.id).toBeDefined()

		// User reads live on the composed submodule (joins roles/locations).
		const detail = await iamSvc.composed.getDetailById(created.id)
		expect(detail.id).toBe(created.id)

		const updated = await iamSvc.user.handleUpdate(
			{ id: detail.id, ...mockUser, fullname: `${detail.fullname} updated` },
			1,
		)
		expect(updated.id).toBe(created.id)

		const removed = await iamSvc.user.handleDelete(created.id)
		expect(removed.id).toBe(created.id)
	})
})
