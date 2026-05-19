import type { IamServiceModule, RoleService, UserService, UserReadService } from '@/modules/iam'

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
	let iamSvc: IamServiceModule
	let roleSvc: RoleService
	let userSvc: UserService
	let userReadSvc: UserReadService

	beforeAll(async () => {
		iamSvc = testCtx.m.iam
		roleSvc = iamSvc.role
		userSvc = iamSvc.user
		userReadSvc = iamSvc.userRead
	})

	test('role CRUD', async () => {
		const mockRole = createMockRole('crud')

		const created = await roleSvc.handleCreate(mockRole, 1)
		expect(created.id).toBeDefined()

		const detail = await roleSvc.handleDetail(created.id)
		expect(detail.id).toBe(created.id)

		const updated = await roleSvc.handleUpdate(
			created.id,
			{
				...mockRole,
				name: `${mockRole.name} updated`,
			},
			1,
		)
		expect(updated.id).toBe(created.id)

		const list = await roleSvc.handleList({
			q: detail.code,
			limit: 10,
			page: 1,
		})
		expect(
			list.data.some((r) => r.code === detail.code),
			`Role ${detail.code} not found`,
		).toBe(true)

		const removed = await roleSvc.handleRemove(updated.id)
		expect(removed.id).toBe(updated.id)
	})

	test('user - crud isRoot', async () => {
		const mockUser = createMockUser('crud-isroot-001')

		const created = await userSvc.handleCreate(mockUser, 1)
		expect(created.id).toBeDefined()

		const detail = await userReadSvc.handleDetail(created.id)
		expect(detail.id).toBe(created.id)

		const updated = await userSvc.handleUpdate(
			{
				id: detail.id,
				...mockUser,
				fullname: `${detail.fullname} updated`,
			},
			1,
		)
		expect(updated.id).toBe(created.id)
		// const list = await userSvc.handleList({
		// 	q: detail.email,
		// 	limit: 10,
		// 	page: 1,
		// })
		// expect(list.data.some((u) => u.email === detail.email)).toBe(true)
		const removed = await userSvc.handleRemove(created.id)
		expect(removed.id).toBe(created.id)
	})
})
