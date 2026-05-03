/* eslint-disable @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/no-unsafe-assignment */
import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, gte, isNull, lte, or } from 'drizzle-orm'

import {
	paginate,
	searchFilter,
	sortBy,
	stampCreate,
	stampUpdate,
	type WithPaginationResult,
	type DbClient,
} from '@/core/database'

import { employeesTable, leaveRequestsTable } from '@/db/schema'

import {
	LeaveRequestCreateDto,
	LeaveRequestDto,
	LeaveRequestFilterDto,
	LeaveRequestSelectDto,
	LeaveRequestUpdateDto,
} from './leave-request.dto'

export class LeaveRequestRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getById(id: number): Promise<LeaveRequestDto | undefined> {
		return record('LeaveRequestRepo.getById', async () => {
			const [request] = await this.db
				.select()
				.from(leaveRequestsTable)
				.where(and(eq(leaveRequestsTable.id, id), isNull(leaveRequestsTable.deletedAt)))

			if (!request) return undefined

			return LeaveRequestDto.parse(request)
		})
	}

	async getListPaginated(
		filter: LeaveRequestFilterDto,
	): Promise<WithPaginationResult<LeaveRequestSelectDto>> {
		return record('LeaveRequestRepo.getListPaginated', async () => {
			const { q, page, limit, employeeId, type, status, dateFrom, dateTo } = filter
			const where = and(
				isNull(leaveRequestsTable.deletedAt),
				q === undefined ? undefined : or(searchFilter(leaveRequestsTable.reason, q)),
				employeeId === undefined ? undefined : eq(leaveRequestsTable.employeeId, employeeId),
				type === undefined ? undefined : eq(leaveRequestsTable.type, type),
				status === undefined ? undefined : eq(leaveRequestsTable.status, status),
				dateFrom === undefined ? undefined : gte(leaveRequestsTable.dateStart, dateFrom),
				dateTo === undefined ? undefined : lte(leaveRequestsTable.dateEnd, dateTo),
			)

			return paginate({
				data: async ({ limit: l, offset }) => {
					const rows = await this.db
						.select({
							id: leaveRequestsTable.id,
							employeeId: leaveRequestsTable.employeeId,
							type: leaveRequestsTable.type,
							status: leaveRequestsTable.status,
							dateStart: leaveRequestsTable.dateStart,
							dateEnd: leaveRequestsTable.dateEnd,
							reason: leaveRequestsTable.reason,
							createdAt: leaveRequestsTable.createdAt,
							updatedAt: leaveRequestsTable.updatedAt,
							employeeName: employeesTable.name,
							employeeCode: employeesTable.code,
						})
						.from(leaveRequestsTable)
						.leftJoin(employeesTable, eq(leaveRequestsTable.employeeId, employeesTable.id))
						.where(where)
						.orderBy(sortBy(leaveRequestsTable.createdAt, 'desc'))
						.limit(l)
						.offset(offset)
					return rows.map((r) => LeaveRequestSelectDto.parse(r))
				},
				pq: { page, limit },
				countQuery: this.db.select({ count: count() }).from(leaveRequestsTable).where(where),
			})
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: LeaveRequestCreateDto, actorId: number): Promise<{ id: number }> {
		return record('LeaveRequestRepo.create', async () => {
			const meta = stampCreate(actorId)
			const [result] = await this.db
				.insert(leaveRequestsTable)
				.values({ ...data, ...meta })
				.returning({ id: leaveRequestsTable.id })

			if (!result) throw new Error('Leave request creation failed')

			return result
		})
	}

	async update(data: LeaveRequestUpdateDto, actorId: number): Promise<{ id: number }> {
		return record('LeaveRequestRepo.update', async () => {
			const { id, ...updateData } = data
			const updateMeta = stampUpdate(actorId)

			const [result] = await this.db
				.update(leaveRequestsTable)
				.set({ ...updateData, ...updateMeta })
				.where(eq(leaveRequestsTable.id, id))
				.returning({ id: leaveRequestsTable.id })

			if (!result) throw new Error('Leave request not found')

			return result
		})
	}

	async softDelete(id: number, actorId: number): Promise<{ id: number }> {
		return record('LeaveRequestRepo.softDelete', async () => {
			const [result] = await this.db
				.update(leaveRequestsTable)
				.set({ deletedAt: new Date(), deletedBy: actorId })
				.where(eq(leaveRequestsTable.id, id))
				.returning({ id: leaveRequestsTable.id })

			if (!result) throw new Error('Leave request not found')

			return result
		})
	}

	async hardDelete(id: number): Promise<{ id: number }> {
		return record('LeaveRequestRepo.hardDelete', async () => {
			const [result] = await this.db
				.delete(leaveRequestsTable)
				.where(eq(leaveRequestsTable.id, id))
				.returning({ id: leaveRequestsTable.id })

			if (!result) throw new Error('Leave request not found')

			return result
		})
	}

	async updateStatus(id: number, status: string, actorId: number): Promise<{ id: number }> {
		return record('LeaveRequestRepo.updateStatus', async () => {
			const updateMeta = stampUpdate(actorId)
			const [result] = await this.db
				.update(leaveRequestsTable)
				.set({ status: status as any, ...updateMeta })
				.where(eq(leaveRequestsTable.id, id))
				.returning({ id: leaveRequestsTable.id })

			if (!result) throw new Error('Leave request not found')

			return result
		})
	}
}
