import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, inArray } from 'drizzle-orm'

import { paginate, sortBy, type WithPaginationResult } from '@/core/database'

import { db } from '@/db'
import { userAssignmentsTable } from '@/db/schema'

import * as dto from '../dto'
import type { OmitPaginationQuery } from '@/types/utils'

export class UserAssignmentRepo {
	/* -------------------------------------------------------------------------- */
	/*                                    QUERY                                   */
	/* -------------------------------------------------------------------------- */

	async getList(
		filter: OmitPaginationQuery<dto.UserAssignmentFilterDto>,
	): Promise<dto.UserAssignmentDto[]> {
		return record('UserAssignmentRepo.getList', async () => {
			const where = this.buildWhereClause(filter)
			return db.select().from(userAssignmentsTable).where(where)
		})
	}

	async getListPaginated(
		filter: dto.UserAssignmentFilterDto,
	): Promise<WithPaginationResult<dto.UserAssignmentDto>> {
		return record('UserAssignmentRepo.getListPaginated', async () => {
			const where = this.buildWhereClause(filter)
			const { page, limit } = filter

			return paginate<dto.UserAssignmentDto>({
				data: ({ limit: l, offset }) =>
					db
						.select()
						.from(userAssignmentsTable)
						.where(where)
						.orderBy(sortBy(userAssignmentsTable.addedAt, 'desc'))
						.limit(l)
						.offset(offset),
				pq: { page, limit },
				countQuery: db.select({ count: count() }).from(userAssignmentsTable).where(where),
			})
		})
	}

	/* -------------------------------------------------------------------------- */
	/*                                  MUTATION                                  */
	/* -------------------------------------------------------------------------- */

	/**
	 * Diff-and-sync: compares incoming list vs existing rows for a user.
	 * - Rows not in incoming → deleted
	 * - Rows in incoming but not existing → inserted
	 * - Rows in both → kept (no update, data is immutable per unique key)
	 * - Exactly one isDefault=true is enforced; auto-assigns first entry if none given
	 */
	async setBulkByUserId(
		userId: number,
		assignments: dto.UserAssignmentUpsertDto[],
		actorId: number,
	): Promise<void> {
		return record('UserAssignmentRepo.setBulkByUserId', async () => {
			await db.transaction(async (tx) => {
				const existing = await tx
					.select()
					.from(userAssignmentsTable)
					.where(eq(userAssignmentsTable.userId, userId))

				// Build lookup key: "roleId:locationId"
				const toKey = (roleId: number, locationId: number) => `${roleId}:${locationId}`

				const existingKeys = new Set(existing.map((r) => toKey(r.roleId, r.locationId)))
				const incomingKeys = new Set(assignments.map((a) => toKey(a.roleId, a.locationId)))

				// IDs to delete: existing rows whose key is not in incoming
				const idsToDelete = existing
					.filter((r) => !incomingKeys.has(toKey(r.roleId, r.locationId)))
					.map((r) => r.id)

				// Entries to insert: incoming entries whose key is not yet existing
				const toInsert = assignments.filter((a) => !existingKeys.has(toKey(a.roleId, a.locationId)))

				// Enforce single isDefault=true — last writer wins if multiple given
				const normalised = this.normaliseDefaults(toInsert, existing, incomingKeys)

				if (idsToDelete.length > 0) {
					await tx
						.delete(userAssignmentsTable)
						.where(
							and(
								eq(userAssignmentsTable.userId, userId),
								inArray(userAssignmentsTable.id, idsToDelete),
							),
						)
				}

				// If the current default row is being deleted, reset it first
				const defaultRowBeingRemoved = existing.find(
					(r) => r.isDefault && !incomingKeys.has(toKey(r.roleId, r.locationId)),
				)
				if (defaultRowBeingRemoved && normalised.every((r) => !r.isDefault)) {
					// No incoming row claims default → auto-assign to first surviving row
					const firstSurvivor = existing.find((r) =>
						incomingKeys.has(toKey(r.roleId, r.locationId)),
					)
					if (firstSurvivor) {
						await tx
							.update(userAssignmentsTable)
							.set({ isDefault: true })
							.where(eq(userAssignmentsTable.id, firstSurvivor.id))
					}
				}

				if (normalised.length > 0) {
					await tx.insert(userAssignmentsTable).values(
						normalised.map((a) => ({
							userId,
							roleId: a.roleId,
							locationId: a.locationId,
							isDefault: a.isDefault,
							addedBy: actorId,
						})),
					)
				}
			})
		})
	}

	/**
	 * Remove a specific assignment by its natural key (userId + roleId + locationId).
	 * Using locationId alone would delete all roles at that location — likely unintended.
	 */
	async remove(userId: number, roleId: number, locationId: number): Promise<void> {
		return record('UserAssignmentRepo.remove', async () => {
			await db.transaction(async (tx) => {
				const [deleted] = await tx
					.delete(userAssignmentsTable)
					.where(
						and(
							eq(userAssignmentsTable.userId, userId),
							eq(userAssignmentsTable.roleId, roleId),
							eq(userAssignmentsTable.locationId, locationId),
						),
					)
					.returning()

				// If the deleted row was the default, promote the earliest remaining row
				if (deleted?.isDefault) {
					const [next] = await tx
						.select()
						.from(userAssignmentsTable)
						.where(eq(userAssignmentsTable.userId, userId))
						.orderBy(sortBy(userAssignmentsTable.addedAt, 'asc'))
						.limit(1)

					if (next) {
						await tx
							.update(userAssignmentsTable)
							.set({ isDefault: true })
							.where(eq(userAssignmentsTable.id, next.id))
					}
				}
			})
		})
	}

	/* -------------------------------------------------------------------------- */
	/*                                  PRIVATE                                   */
	/* -------------------------------------------------------------------------- */

	private buildWhereClause(
		filter: Partial<Pick<dto.UserAssignmentFilterDto, 'userId' | 'roleId' | 'locationId'>>,
	) {
		const { userId, roleId, locationId } = filter
		return and(
			userId ? eq(userAssignmentsTable.userId, userId) : undefined,
			roleId ? eq(userAssignmentsTable.roleId, roleId) : undefined,
			locationId ? eq(userAssignmentsTable.locationId, locationId) : undefined,
		)
	}

	/**
	 * Ensures exactly one isDefault=true across all assignments for a user.
	 * Priority: explicit true in toInsert > existing default survives > first entry.
	 */
	private normaliseDefaults(
		toInsert: dto.UserAssignmentUpsertDto[],
		existing: dto.UserAssignmentDto[],
		incomingKeys: Set<string>,
	): dto.UserAssignmentUpsertDto[] {
		const toKey = (roleId: number, locationId: number) => `${roleId}:${locationId}`
		const existingDefaultSurvives = existing.some(
			(r) => r.isDefault && incomingKeys.has(toKey(r.roleId, r.locationId)),
		)
		const hasExplicitDefault = toInsert.some((a) => a.isDefault)

		// If existing default row survives, clear any incoming default claims
		if (existingDefaultSurvives) {
			return toInsert.map((a) => ({ ...a, isDefault: false }))
		}

		// If no default claimed and there's nothing to promote, auto-assign to first insert
		if (!hasExplicitDefault && toInsert.length > 0 && existing.length === 0) {
			return toInsert.map((a, i) => ({ ...a, isDefault: i === 0 }))
		}

		// Keep at most one explicit default (last one wins if multiple)
		let defaultAssigned = false
		return [...toInsert]
			.reverse()
			.map((a) => {
				if (a.isDefault && !defaultAssigned) {
					defaultAssigned = true
					return a
				}
				return { ...a, isDefault: false }
			})
			.reverse()
	}
}
