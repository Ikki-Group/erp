import type { IamServiceModule, RoleService, UserService } from '@/modules/iam'

import { testCtx } from '../setup'
import { describe, test, expect, beforeAll } from 'bun:test'

const mockRole = {
	code: 'TEST_ROLE',
	name: 'Test Role',
	description: 'Description',
	permissions: ['iam.user.read'],
	isSystem: false,
}

const mockUser = {
	email: 'test-svc-001@ikki.com',
	username: 'test-svc-001',
	fullname: 'Test User Svc',
	password: 'password12345',
	isActive: true,
	isRoot: false,
	pinCode: '1234',
	defaultLocationId: 1,
	assignments: [],
}

describe('services/iam', () => {
	let iamSvc: IamServiceModule
	let roleSvc: RoleService
	let userSvc: UserService

	let createdRoleId: number
	let createdUserId: number

	beforeAll(async () => {
		iamSvc = testCtx.m.iam
		roleSvc = iamSvc.role
		userSvc = iamSvc.user
	})

	describe('role', () => {
		test('get list', async () => {
			const res = await roleSvc.handleList({
				page: 1,
				limit: 10,
				q: '',
			})

			expect(res.data.length).toBeGreaterThan(0)
		})

		test.serial('create', async () => {
			const res = await roleSvc.handleCreate(mockRole, 1)

			createdRoleId = res.id
			expect(res.id).toBeGreaterThan(0)
		})

		test.serial('update', async () => {
			const res = await roleSvc.handleUpdate(
				createdRoleId,
				{
					...mockRole,
					name: `${mockRole.name}_updated`,
				},
				1,
			)

			expect(res.id).toBe(createdRoleId)
		})

		test.serial('remove', async () => {
			const res = await roleSvc.handleRemove(createdRoleId)
			expect(res.id).toBe(createdRoleId)
		})
	})

	describe('user', () => {
		test('get list', async () => {
			const res = await userSvc.handleList({
				page: 1,
				limit: 10,
				q: '',
			})

			expect(res.data.length).toBeGreaterThan(0)
		})

		test.serial('create', async () => {
			const res = await userSvc.handleCreate(mockUser, 1)

			createdUserId = res.id
			expect(res.id).toBeGreaterThan(0)
		})

		test.serial('id exist in list', async () => {
			const res = await userSvc.handleList({
				page: 1,
				limit: 10,
				q: mockUser.username,
			})

			expect(res.data.length).toBeGreaterThan(0)
		})

		test.serial('get detail', async () => {
			const res = await userSvc.handleDetail(createdUserId)
			expect(res.id).toBe(createdUserId)
		})

		test.serial('update', async () => {
			const res = await userSvc.handleUpdate(
				createdUserId,
				{
					id: createdUserId,
					...mockUser,
					username: `${mockUser.username}_updated`,
				},
				1,
			)

			expect(res.id).toBe(createdUserId)
		})

		test.serial('remove', async () => {
			const res = await userSvc.handleRemove(createdUserId)
			expect(res.id).toBe(createdUserId)
		})
	})
})
