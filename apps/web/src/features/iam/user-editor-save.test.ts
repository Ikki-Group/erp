import { describe, expect, it } from 'vitest'

import type { AssignmentCreateDto, UserDetailDto, UserUpdateDto } from './dto'
import { createUserEditorSession } from './user-editor-save'
import type { UserEditorAdapter } from './user-editor-save'
import { emptyUserFormValues } from './user-form-values'
import type { UserFormValues } from './user-form-values'

const initialUser: UserDetailDto = {
	id: 7,
	username: 'jane',
	name: 'Jane',
	email: 'jane@example.com',
	isActive: true,
	createdAt: new Date('2026-01-01T00:00:00Z'),
	updatedAt: new Date('2026-01-01T00:00:00Z'),
	createdBy: null,
	updatedBy: null,
	assignments: [],
}

function values(
	assignments: [number, number | null][],
	mode: 'global' | 'per_location' = 'global',
): UserFormValues {
	return {
		...emptyUserFormValues(),
		username: 'jane',
		name: 'Jane',
		email: 'jane@example.com',
		password: 'password123',
		assignmentMode: mode,
		assignments: assignments.map(([roleId, locationId], index) => ({
			clientKey: `client-${index}`,
			roleId,
			locationId,
		})),
	}
}

/** Enforces real assignment uniqueness/scope constraints and commits every successful request. */
function accountStore(existing?: UserDetailDto) {
	const state = {
		user: existing ? structuredClone(existing) : undefined,
		createCount: 0,
		detailCount: 0,
		assignCount: 0,
		removeCount: 0,
		failAssignNumber: 0,
		failRemoveNumber: 0,
		failCreate: false,
		failDetail: false,
		updates: [] as UserUpdateDto[],
		events: [] as string[],
	}
	const getUser = () => {
		if (!state.user) throw new Error('Account missing')
		return state.user
	}
	const matches = (a: { roleId: number; locationId: number | null }, b: AssignmentCreateDto) =>
		a.roleId === b.roleId && a.locationId === b.locationId
	const adapter: UserEditorAdapter = {
		create: async (input) => {
			state.createCount += 1
			if (state.failCreate) throw new Error('Create unavailable')
			if (state.user) throw new Error('Duplicate account')
			state.user = {
				...structuredClone(initialUser),
				username: input.username,
				email: input.email,
				name: input.name,
				isActive: input.isActive,
			}
			return { id: state.user.id }
		},
		detail: async (id) => {
			state.detailCount += 1
			if (state.failDetail) throw new Error('Detail unavailable')
			const user = getUser()
			if (user.id !== id) throw new Error('Wrong account')
			return structuredClone(user)
		},
		update: async (input) => {
			const user = getUser()
			if (user.id !== input.id) throw new Error('Wrong account')
			state.updates.push(input)
			Object.assign(user, input)
		},
		assign: async (input) => {
			state.assignCount += 1
			state.events.push(`assign:${input.roleId}:${input.locationId}`)
			if (state.assignCount === state.failAssignNumber) throw new Error('Assignment unavailable')
			const user = getUser()
			if (user.id !== input.userId) throw new Error('Wrong account')
			if (user.assignments.some((assignment) => matches(assignment, input)))
				throw new Error('Duplicate assignment')
			if (
				user.assignments.some(
					(assignment) => (assignment.locationId === null) !== (input.locationId === null),
				)
			)
				throw new Error('Mixed scope')
			if (
				input.locationId !== null &&
				user.assignments.some((assignment) => assignment.locationId === input.locationId)
			) {
				throw new Error('Location already assigned')
			}
			user.assignments.push({
				id: state.assignCount,
				roleId: input.roleId,
				locationId: input.locationId,
				role: { id: input.roleId, code: `R-${input.roleId}`, name: `Role ${input.roleId}` },
				location:
					input.locationId === null
						? null
						: { id: input.locationId, code: `L-${input.locationId}`, name: 'Location' },
			})
		},
		remove: async (input) => {
			state.removeCount += 1
			state.events.push(`remove:${input.roleId}:${input.locationId}`)
			if (state.removeCount === state.failRemoveNumber) throw new Error('Removal unavailable')
			const user = getUser()
			const index = user.assignments.findIndex((assignment) => matches(assignment, input))
			if (index < 0) throw new Error('Assignment already removed')
			user.assignments.splice(index, 1)
		},
	}
	return { state, adapter }
}

function assignmentPairs(user: UserDetailDto | undefined) {
	return user?.assignments.map(({ roleId, locationId }) => [roleId, locationId])
}

describe('user editor session', () => {
	it('creates once and retries only the missing assignment after partial success', async () => {
		const { state, adapter } = accountStore()
		state.failAssignNumber = 2
		const createdIds: number[] = []
		const session = createUserEditorSession(adapter, undefined, (id) => createdIds.push(id))
		const input = values([
			[1, null],
			[2, null],
		])

		await expect(session.save(input)).rejects.toThrow('Account saved, access changes incomplete.')
		expect(state.createCount).toBe(1)
		expect(state.assignCount).toBe(2)
		expect(assignmentPairs(state.user)).toEqual([[1, null]])
		expect(createdIds).toEqual([7])
		await expect(session.save(input)).resolves.toBe(7)
		expect(state.createCount).toBe(1)
		expect(state.detailCount).toBe(2)
		expect(state.events).toEqual(['assign:1:null', 'assign:2:null', 'assign:2:null'])
		expect(state.updates).toEqual([])
		expect(assignmentPairs(state.user)).toEqual([
			[1, null],
			[2, null],
		])
	})

	it('refreshes partially edited assignments and never repeats committed removals or profile updates', async () => {
		const { state, adapter } = accountStore(initialUser)
		await adapter.assign({ userId: 7, roleId: 1, locationId: null })
		await adapter.assign({ userId: 7, roleId: 2, locationId: null })
		state.events = []
		state.failAssignNumber = 4
		const input = {
			...values(
				[
					[3, 10],
					[4, 20],
				],
				'per_location',
			),
			name: 'Jane Updated',
		}
		const session = createUserEditorSession(adapter, 7)

		await expect(session.save(input)).rejects.toThrow('Account saved, access changes incomplete.')
		expect(assignmentPairs(state.user)).toEqual([[3, 10]])
		expect(state.updates).toHaveLength(1)
		expect(state.updates[0]).not.toHaveProperty('password')
		await session.save(input)
		expect(state.events).toEqual([
			'remove:1:null',
			'remove:2:null',
			'assign:3:10',
			'assign:4:20',
			'assign:4:20',
		])
		expect(state.updates).toHaveLength(1)
		expect(assignmentPairs(state.user)).toEqual([
			[3, 10],
			[4, 20],
		])
	})

	it('finishes remaining removals before adding when the user changes desired scope on retry', async () => {
		const { state, adapter } = accountStore(initialUser)
		await adapter.assign({ userId: 7, roleId: 1, locationId: 10 })
		await adapter.assign({ userId: 7, roleId: 2, locationId: 20 })
		state.events = []
		state.failRemoveNumber = 2
		const session = createUserEditorSession(adapter, 7)
		await expect(session.save(values([[3, null]]))).rejects.toThrow('Removal unavailable')
		expect(assignmentPairs(state.user)).toEqual([[2, 20]])
		await session.save(values([[4, 20]], 'per_location'))
		expect(state.events).toEqual(['remove:1:10', 'remove:2:20', 'remove:2:20', 'assign:4:20'])
		expect(assignmentPairs(state.user)).toEqual([[4, 20]])
	})

	it('keeps a confirmed created account when loading its detail fails', async () => {
		const { state, adapter } = accountStore()
		state.failDetail = true
		const session = createUserEditorSession(adapter)
		await expect(session.save(values([[1, null]]))).rejects.toThrow('Account already created')
		expect(state.createCount).toBe(1)
		expect(state.assignCount).toBe(0)
		state.failDetail = false
		await session.save(values([[1, null]]))
		expect(state.createCount).toBe(1)
		expect(assignmentPairs(state.user)).toEqual([[1, null]])
	})

	it('does not retain an ID before create succeeds or retry automatically', async () => {
		const { state, adapter } = accountStore()
		state.failCreate = true
		const session = createUserEditorSession(adapter)
		await expect(session.save(values([]))).rejects.toThrow('Create unavailable')
		expect(state.createCount).toBe(1)
		expect(state.detailCount).toBe(0)
		state.failCreate = false
		await session.save(values([]))
		expect(state.createCount).toBe(2)
		expect(state.detailCount).toBe(1)
	})

	it('rejects incomplete access before making any account request', async () => {
		const { state, adapter } = accountStore()
		const input = values([[1, null]], 'per_location')
		await expect(createUserEditorSession(adapter).save(input)).rejects.toThrow('Select a location')
		expect(state.createCount).toBe(0)
		expect(state.detailCount).toBe(0)
	})
})
