// @vitest-environment jsdom
import { QueryObserver } from '@tanstack/react-query'

import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { ApiError, setActiveLocationAccessor } from '@/lib/api/index.ts'
import { queryClient } from '@/lib/tanstack-query'

import { assignmentResource, roleResource, userResource } from './api.ts'

interface FixtureUser {
	id: number
	username: string
	email: string
	name: string
	isActive: boolean
}
interface FixtureAssignment {
	userId: number
	roleId: number
	locationId: number | null
}

const filters = { page: 1, limit: 10 }
let activeLocation: number | null = null
let failStaffReads = false

beforeEach(() => {
	activeLocation = null
	failStaffReads = false
	setActiveLocationAccessor(() => activeLocation)
})

afterEach(() => {
	queryClient.clear()
	setActiveLocationAccessor(() => null)
	vi.unstubAllGlobals()
})

/** In-memory IAM backend: staff rows are derived from assignments like the real server filter. */
function serve() {
	const users: FixtureUser[] = [
		{ id: 1, username: 'ana', email: 'ana@x.test', name: 'Ana', isActive: true },
		{ id: 2, username: 'budi', email: 'budi@x.test', name: 'Budi', isActive: true },
		{ id: 3, username: 'citra', email: 'citra@x.test', name: 'Citra', isActive: true },
	]
	const roles = new Map([
		[10, 'Cashier'],
		[11, 'Manager'],
	])
	let assignments: FixtureAssignment[] = [
		{ userId: 1, roleId: 10, locationId: 1 },
		{ userId: 2, roleId: 10, locationId: 2 },
		{ userId: 3, roleId: 11, locationId: null },
	]
	const ok = (data: unknown) => Response.json({ success: true, code: 'OK', data })
	const staffAt = (locationId: number) => {
		const data = assignments
			.filter((assignment) => assignment.locationId === locationId)
			.flatMap((assignment) => {
				const user = users.find((candidate) => candidate.id === assignment.userId)
				if (!user) return []
				return [{ ...user, roleName: roles.get(assignment.roleId) ?? '' }]
			})
		const meta = { page: 1, limit: 10, total: data.length, totalPages: 1 }
		return Response.json({ success: true, code: 'OK', data, meta })
	}

	vi.stubGlobal('localStorage', { getItem: () => null })
	vi.stubGlobal(
		'fetch',
		vi.fn<typeof fetch>(async (input, init) => {
			const url = new URL(String(input), 'http://localhost')
			const method = init?.method ?? 'GET'
			const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {}
			const { pathname } = url

			if (pathname.endsWith('/iam/user/location-staff/list')) {
				if (failStaffReads) return Response.json({ success: false }, { status: 500 })
				const header = new Headers(init?.headers).get('X-Location-ID')
				return staffAt(Number(header))
			}
			if (pathname.endsWith('/iam/user/by-location')) {
				if (failStaffReads) return Response.json({ success: false }, { status: 500 })
				return staffAt(Number(url.searchParams.get('locationId')))
			}
			if (pathname.endsWith('/iam/user/update')) {
				const index = users.findIndex((user) => user.id === body.id)
				users[index] = { ...users[index]!, ...(body as Partial<FixtureUser>) }
			} else if (pathname.endsWith('/iam/user/deactivate')) {
				const user = users.find((candidate) => candidate.id === Number(url.searchParams.get('id')))
				if (user) user.isActive = false
			} else if (pathname.endsWith('/iam/assignment/assign')) {
				assignments = [...assignments, body as unknown as FixtureAssignment]
			} else if (pathname.endsWith('/iam/assignment/remove')) {
				assignments = assignments.filter(
					(a) =>
						!(
							a.userId === body.userId &&
							a.roleId === body.roleId &&
							a.locationId === body.locationId
						),
				)
			} else if (pathname.endsWith('/iam/role/update')) {
				roles.set(Number(body.id), String(body.name))
			} else if (method === 'GET') {
				return Response.json({ success: false }, { status: 404 })
			}
			return ok({ id: Number(body.id ?? 1) })
		}),
	)
}

const subscriptions: (() => void)[] = []
afterEach(() => {
	for (const unsubscribe of subscriptions) unsubscribe()
	subscriptions.length = 0
})

it('does not reuse location-staff data across active locations for identical filters', async () => {
	serve()

	activeLocation = 1
	const atOne = await queryClient.fetchQuery(userResource.locationStaff.queryOptions(filters))
	activeLocation = 2
	const atTwo = await queryClient.fetchQuery(userResource.locationStaff.queryOptions(filters))

	expect(atOne.data.map((staff) => staff.name)).toEqual(['Ana'])
	expect(atTwo.data.map((staff) => staff.name)).toEqual(['Budi'])
	const keyAtTwo = userResource.locationStaff.queryKey(filters)
	activeLocation = 1
	expect(userResource.locationStaff.queryKey(filters)).not.toEqual(keyAtTwo)
})

it('surfaces a failed staff read as an error rather than an empty list', async () => {
	serve()
	failStaffReads = true
	activeLocation = 1

	await expect(
		queryClient.fetchQuery(userResource.locationStaff.queryOptions(filters, { retry: false })),
	).rejects.toThrow(ApiError)
	expect(queryClient.getQueryData(userResource.locationStaff.queryKey(filters))).toBeUndefined()
})

it('refreshes loaded location-staff and by-location readers after profile, assignment and role writes', async () => {
	serve()
	activeLocation = 1
	const locationStaff = new QueryObserver(
		queryClient,
		userResource.locationStaff.queryOptions(filters, { retry: false }),
	)
	const byLocation = new QueryObserver(
		queryClient,
		userResource.byLocation.queryOptions({ ...filters, locationId: 2 }, { retry: false }),
	)
	subscriptions.push(
		locationStaff.subscribe(() => {}),
		byLocation.subscribe(() => {}),
	)
	await Promise.all([
		locationStaff.refetch({ throwOnError: true }),
		byLocation.refetch({ throwOnError: true }),
	])
	const here = () => locationStaff.getCurrentResult().data?.data
	const there = () => byLocation.getCurrentResult().data?.data
	expect(here()?.map((staff) => staff.name)).toEqual(['Ana'])
	expect(there()?.map((staff) => staff.name)).toEqual(['Budi'])

	// Profile change
	await userResource.update.fetch({
		id: 1,
		username: 'ana',
		email: 'ana@x.test',
		name: 'Ana Putri',
		isActive: true,
	})
	expect(here()?.[0]?.name).toBe('Ana Putri')

	// Role rename changes roleName in both families
	await roleResource.update.fetch({
		id: 10,
		code: 'CASHIER',
		name: 'Head Cashier',
		description: '',
		permissions: [],
	})
	expect(here()?.[0]?.roleName).toBe('Head Cashier')
	expect(there()?.[0]?.roleName).toBe('Head Cashier')

	// Assignment add / remove
	await assignmentResource.assign.fetch({ userId: 3, roleId: 11, locationId: 1 })
	expect(here()?.map((staff) => staff.name)).toEqual(['Ana Putri', 'Citra'])
	await assignmentResource.assign.fetch({ userId: 3, roleId: 11, locationId: 2 })
	expect(there()?.map((staff) => staff.name)).toEqual(['Budi', 'Citra'])
	await assignmentResource.remove.fetch({ userId: 3, roleId: 11, locationId: 1 })
	expect(here()?.map((staff) => staff.name)).toEqual(['Ana Putri'])

	// Deactivation
	await userResource.deactivate.fetch({ id: 2 })
	expect(there()?.[0]?.isActive).toBe(false)
})

it('refreshes a staff reader cached under a different active location', async () => {
	serve()
	activeLocation = 1
	await queryClient.fetchQuery(userResource.locationStaff.queryOptions(filters))
	const keyAtOne = userResource.locationStaff.queryKey(filters)
	expect(queryClient.getQueryState(keyAtOne)?.isInvalidated).toBe(false)

	activeLocation = 2
	await userResource.create.fetch({
		username: 'dewi',
		email: 'dewi@x.test',
		name: 'Dewi',
		password: 'password123',
		isActive: true,
	})

	expect(queryClient.getQueryState(keyAtOne)?.isInvalidated).toBe(true)
})
