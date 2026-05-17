import type { IamServiceModule, RoleService } from '@/modules/iam'

import { testCtx } from '../setup'
import { describe, test, expect, beforeAll } from 'bun:test'

// const mockUser: Parameters<UserService['handleCreate']>[0] = {
// 	email: 'test-svc-001@ikki.com',
// 	username: 'test-svc-001',
// 	fullname: 'Test User Svc',
// 	password: 'password12345',
// 	isActive: true,
// 	isRoot: false,
// 	pinCode: '1234',
// 	defaultLocationId: 1,
// 	assignments: [],
// }

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

	beforeAll(async () => {
		iamSvc = testCtx.m.iam
		roleSvc = iamSvc.role
	})

	test('role CRUD', async () => {
		const created = await roleSvc.handleCreate(createMockRole('crud'), 1)
		expect(created.id).toBeDefined()

		const detail = await roleSvc.handleDetail(created.id)
		expect(detail.id).toBe(created.id)

		const updated = await roleSvc.handleUpdate(
			created.id,
			{
				...createMockRole('crud'),
				name: `${detail.name} updated`,
			},
			1,
		)
		expect(updated.id).toBe(created.id)

		const list = await roleSvc.handleList({
			q: detail.code,
			limit: 10,
			page: 1,
		})
		expect(list.data.some((r) => r.code === detail.code)).toBe(true)

		const removed = await roleSvc.handleRemove(updated.id)
		expect(removed.id).toBe(updated.id)
	})
})
