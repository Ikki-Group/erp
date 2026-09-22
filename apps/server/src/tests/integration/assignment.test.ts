import { loginAs } from '../helpers/auth.ts'
import { DELETE, GET, POST, json } from '../helpers/request.ts'
import { SEED_USERS } from '../helpers/seed.ts'
import { expect, test } from 'bun:test'

type IdRow = { id: number }
type RoleRow = IdRow & { code: string }

test('IAM assignments enforce role and access invariants', async () => {
	const token = await loginAs(SEED_USERS.owner.username)
	const ownerUserResponse = await GET('/iam/user/list', {
		token,
		query: { q: 'owner', page: '1', limit: '10' },
	})
	const ownerUser = (await json<{ data: IdRow[] }>(ownerUserResponse)).data[0]

	const ownerRoleResponse = await GET('/iam/role/list', {
		token,
		query: { q: 'owner', page: '1', limit: '10' },
	})
	const ownerRole = (await json<{ data: RoleRow[] }>(ownerRoleResponse)).data[0]

	const scopedOwnerResponse = await POST('/iam/assignment/assign', {
		token,
		body: { userId: ownerUser!.id, roleId: ownerRole!.id, locationId: 1 },
	})
	expect(scopedOwnerResponse.status).toBe(400)

	const unknownUserResponse = await POST('/iam/assignment/assign', {
		token,
		body: { userId: 999999, roleId: ownerRole!.id, locationId: null },
	})
	expect(unknownUserResponse.status).toBe(404)

	const multiLocationUserResponse = await GET('/iam/user/list', {
		token,
		query: { q: 'multi-location', page: '1', limit: '10' },
	})
	const multiLocationUser = (await json<{ data: IdRow[] }>(multiLocationUserResponse)).data[0]
	const managerRoleResponse = await GET('/iam/role/list', {
		token,
		query: { q: 'manager', page: '1', limit: '10' },
	})
	const managerRole = (await json<{ data: RoleRow[] }>(managerRoleResponse)).data[0]
	const duplicateResponse = await POST('/iam/assignment/assign', {
		token,
		body: { userId: multiLocationUser!.id, roleId: managerRole!.id, locationId: 1 },
	})
	expect(duplicateResponse.status).toBe(409)

	const removeLastOwnerResponse = await DELETE('/iam/assignment/remove', {
		token,
		body: { userId: ownerUser!.id, roleId: ownerRole!.id, locationId: null },
	})
	expect(removeLastOwnerResponse.status).toBe(400)
})
