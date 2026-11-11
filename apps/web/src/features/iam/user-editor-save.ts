import { isApiError } from '@/lib/api/errors'

import type { AssignmentCreateDto, UserCreateDto, UserDetailDto, UserUpdateDto } from './dto'
import { toUserAssignments, toUserCreateInput, toUserUpdateInput } from './user-form-values'
import type { UserFormValues } from './user-form-values'

/** Resource fetches in production, an in-memory account store in tests. No cached detail snapshots. */
export interface UserEditorAdapter {
	create: (input: UserCreateDto) => Promise<{ id: number }>
	detail: (id: number) => Promise<UserDetailDto>
	update: (input: UserUpdateDto) => Promise<unknown>
	assign: (input: AssignmentCreateDto) => Promise<unknown>
	remove: (input: AssignmentCreateDto) => Promise<unknown>
}

const assignmentKey = (assignment: { roleId: number; locationId: number | null }) =>
	`${assignment.roleId}:${assignment.locationId ?? 'global'}`

function partialSaveError(error: unknown, accessOnly: boolean) {
	const reason = isApiError(error)
		? error.friendlyMessage
		: error instanceof Error
			? error.message
			: 'The request failed.'
	return new Error(
		`${accessOnly ? 'Account saved, access changes incomplete.' : 'Account already created, remaining changes incomplete.'} ${reason} Save again to retry the remaining changes; completed changes have not been rolled back.`,
		{ cause: error },
	)
}

/** One editing session retains only the account ID; retries are explicitly initiated by the user. */
export function createUserEditorSession(
	adapter: UserEditorAdapter,
	initialUserId?: number,
	onCreated?: (id: number) => void,
) {
	let userId = initialUserId

	return {
		async save(values: UserFormValues): Promise<number> {
			// Validate all assignments before creating or changing the account.
			const desiredAssignments = toUserAssignments(values)
			if (userId === undefined) {
				const created = await adapter.create(toUserCreateInput(values))
				userId = created.id
				onCreated?.(userId)
			}

			const id = userId
			let current: UserDetailDto
			try {
				// Always fetch authoritative state, including after a partially completed attempt.
				current = await adapter.detail(id)
				const update = toUserUpdateInput(id, values)
				if (
					current.username !== update.username ||
					current.email !== update.email ||
					current.name !== update.name ||
					current.isActive !== update.isActive
				) {
					await adapter.update(update)
				}
			} catch (error) {
				if (initialUserId === undefined) throw partialSaveError(error, false)
				throw error
			}

			try {
				const desired = new Set(desiredAssignments.map(assignmentKey))
				const existing = new Set(current.assignments.map(assignmentKey))
				// Mixed scope and multiple roles per location are rejected by the server.
				// Finish all removals before attempting any additions, including scope switches.
				for (const assignment of current.assignments) {
					if (!desired.has(assignmentKey(assignment))) {
						await adapter.remove({
							userId: id,
							roleId: assignment.roleId,
							locationId: assignment.locationId,
						})
					}
				}
				for (const assignment of desiredAssignments) {
					if (!existing.has(assignmentKey(assignment))) {
						await adapter.assign({ userId: id, ...assignment })
					}
				}
			} catch (error) {
				throw partialSaveError(error, true)
			}
			return id
		},
	}
}
