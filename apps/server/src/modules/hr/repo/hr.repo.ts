import { record } from '@elysiajs/opentelemetry'
import { and, count, desc, eq, gte, ilike, isNull, lte, or } from 'drizzle-orm'

import { bento, CACHE_KEY_DEFAULT } from '@/core/cache'
import { paginate, stampCreate, stampUpdate, type WithPaginationResult } from '@/core/database'

import { db } from '@/db'
import { attendancesTable, employeesTable, locationsTable, shiftsTable } from '@/db/schema'

import type {
	AttendanceDto,
	AttendanceFilterDto,
	AttendanceSelectDto,
	ClockInDto,
	ShiftCreateDto,
	ShiftDto,
} from '../dto/hr.dto'

const cache = bento.namespace('hr')

export class HRRepo {
	/* -------------------------------- INTERNAL -------------------------------- */

	async #clearCache(id?: number): Promise<void> {
		const keys = [CACHE_KEY_DEFAULT.list, CACHE_KEY_DEFAULT.count]
		if (id) keys.push(CACHE_KEY_DEFAULT.byId(id))
		await cache.deleteMany({ keys })
	}

	/* ---------------------------------- QUERY --------------------------------- */

	async getShiftListPaginated(page: number, limit: number): Promise<WithPaginationResult<ShiftDto>> {
		return record('HRRepo.getShiftListPaginated', async () => {
			return cache.getOrSet({
				key: `shifts.${page}.${limit}`,
				factory: async () => {
					return paginate({
						data: ({ limit: l, offset }) =>
							db
								.select()
								.from(shiftsTable)
								.where(isNull(shiftsTable.deletedAt))
								.limit(l)
								.offset(offset),
						pq: { page, limit },
						countQuery: db
							.select({ count: count() })
							.from(shiftsTable)
							.where(isNull(shiftsTable.deletedAt)),
					}) as unknown as WithPaginationResult<ShiftDto>
				},
			})
		})
	}

	async getAttendanceListPaginated(
		filter: AttendanceFilterDto,
	): Promise<WithPaginationResult<AttendanceSelectDto>> {
		return record('HRRepo.getAttendanceListPaginated', async () => {
			const { q, employeeId, locationId, status, dateFrom, dateTo, page, limit } = filter
			const key = `attendance.list.${JSON.stringify(filter)}`

			return cache.getOrSet({
				key,
				factory: async () => {
					const searchCondition = q
						? or(ilike(employeesTable.name, `%${q}%`), ilike(employeesTable.code, `%${q}%`))
						: undefined

					const dateCondition =
						dateFrom && dateTo
							? and(gte(attendancesTable.date, dateFrom), lte(attendancesTable.date, dateTo))
							: dateFrom
								? gte(attendancesTable.date, dateFrom)
								: dateTo
									? lte(attendancesTable.date, dateTo)
									: undefined

					const where = and(
						isNull(attendancesTable.deletedAt),
						employeeId ? eq(attendancesTable.employeeId, employeeId) : undefined,
						locationId ? eq(attendancesTable.locationId, locationId) : undefined,
						status ? eq(attendancesTable.status, status) : undefined,
						dateCondition,
						searchCondition,
					)

					return paginate({
						data: ({ limit: l, offset }) =>
							db
								.select({
									id: attendancesTable.id,
									employeeId: attendancesTable.employeeId,
									locationId: attendancesTable.locationId,
									shiftId: attendancesTable.shiftId,
									date: attendancesTable.date,
									clockIn: attendancesTable.clockIn,
									clockOut: attendancesTable.clockOut,
									status: attendancesTable.status,
									note: attendancesTable.note,
									createdAt: attendancesTable.createdAt,
									updatedAt: attendancesTable.updatedAt,
									createdBy: attendancesTable.createdBy,
									updatedBy: attendancesTable.updatedBy,
									employeeName: employeesTable.name,
									employeeCode: employeesTable.code,
									locationName: locationsTable.name,
									shiftName: shiftsTable.name,
								})
								.from(attendancesTable)
								.innerJoin(employeesTable, eq(attendancesTable.employeeId, employeesTable.id))
								.innerJoin(locationsTable, eq(attendancesTable.locationId, locationsTable.id))
								.leftJoin(shiftsTable, eq(attendancesTable.shiftId, shiftsTable.id))
								.where(where)
								.orderBy(desc(attendancesTable.date))
								.limit(l)
								.offset(offset),
						pq: { page, limit },
						countQuery: db
							.select({ count: count() })
							.from(attendancesTable)
							.innerJoin(employeesTable, eq(attendancesTable.employeeId, employeesTable.id))
							.where(where),
					}) as unknown as WithPaginationResult<AttendanceSelectDto>
				},
			})
		})
	}

	async findOpenAttendance(employeeId: number): Promise<any | undefined> {
		const [existing] = await db
			.select()
			.from(attendancesTable)
			.where(
				and(
					eq(attendancesTable.employeeId, employeeId),
					isNull(attendancesTable.clockOut),
					isNull(attendancesTable.deletedAt),
				),
			)
		return existing
	}

	async getAttendanceById(id: number): Promise<any | undefined> {
		const [result] = await db
			.select()
			.from(attendancesTable)
			.where(and(eq(attendancesTable.id, id), isNull(attendancesTable.deletedAt)))
		return result
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async createShift(data: ShiftCreateDto, actorId: number): Promise<ShiftDto> {
		return record('HRRepo.createShift', async () => {
			const metadata = stampCreate(actorId)
			const [result] = await db
				.insert(shiftsTable)
				.values({
					...data,
					note: data.note ?? null,
					...metadata,
				})
				.returning()

			if (!result) throw new Error('Failed to create shift')
			void this.#clearCache()
			return result as unknown as ShiftDto
		})
	}

	async clockIn(data: ClockInDto, actorId: number): Promise<AttendanceDto> {
		return record('HRRepo.clockIn', async () => {
			const metadata = stampCreate(actorId)
			const [result] = await db
				.insert(attendancesTable)
				.values({
					...data,
					note: data.note ?? null,
					date: new Date(),
					clockIn: new Date(),
					status: 'present',
					...metadata,
				})
				.returning()

			if (!result) throw new Error('Failed to clock in')
			void this.#clearCache()
			return result as unknown as AttendanceDto
		})
	}

	async clockOut(id: number, note: string | null, actorId: number): Promise<AttendanceDto> {
		return record('HRRepo.clockOut', async () => {
			const metadata = stampUpdate(actorId)
			const [result] = await db
				.update(attendancesTable)
				.set({ clockOut: new Date(), note: note as any, ...metadata })
				.where(eq(attendancesTable.id, id))
				.returning()

			if (!result) throw new Error('Failed to clock out')
			void this.#clearCache(id)
			return result as unknown as AttendanceDto
		})
	}
}
