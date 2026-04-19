import { record } from '@elysiajs/opentelemetry'
import { and, desc, eq, gte, ilike, isNull, lte, or, sql } from 'drizzle-orm'

import { bento } from '@/core/cache'
import { paginate, stampCreate, stampUpdate, takeFirstOrThrow } from '@/core/database'

const cache = bento.namespace('hr')
import { ConflictError, NotFoundError } from '@/core/http/errors'
import type { PaginationQuery, WithPaginationResult } from '@/core/utils/pagination'

import { db } from '@/db'
import { attendancesTable, employeesTable, locationsTable, shiftsTable } from '@/db/schema'

import type {
	AttendanceDto,
	AttendanceFilterDto,
	AttendanceSelectDto,
	ClockInDto,
	ClockOutDto,
	ShiftCreateDto,
	ShiftDto,
} from '../dto/hr.dto'

const err = {
	notFound: (id: number) =>
		new NotFoundError(`Attendance with ID ${id} not found`, 'ATTENDANCE_NOT_FOUND'),
	alreadyClockedIn: (employeeId: number) =>
		new ConflictError(`Employee with ID ${employeeId} is already clocked in`, 'ALREADY_CLOCKED_IN'),
	notClockedIn: (id: number) =>
		new ConflictError(`Attendance with ID ${id} is not clocked in`, 'NOT_CLOCKED_IN'),
	alreadyClockedOut: (id: number) =>
		new ConflictError(`Attendance with ID ${id} is already clocked out`, 'ALREADY_CLOCKED_OUT'),
}

export class HRService {
	/* ──────────────────── SHIFT ──────────────────── */

	async handleShiftList(pq: PaginationQuery): Promise<WithPaginationResult<ShiftDto>> {
		return record('HRService.handleShiftList', async () => {
			return cache.getOrSet({
				key: `shifts.${pq.page}.${pq.limit}`,
				factory: async () => {
					const result = await paginate({
						data: ({ limit, offset }) =>
							db
								.select()
								.from(shiftsTable)
								.where(isNull(shiftsTable.deletedAt))
								.limit(limit)
								.offset(offset),
						pq,
						countQuery: db
							.select({ count: sql<number>`count(*)` })
							.from(shiftsTable)
							.where(isNull(shiftsTable.deletedAt)),
					})

					return result as unknown as WithPaginationResult<ShiftDto>
				},
			})
		})
	}

	async handleShiftCreate(data: ShiftCreateDto, actorId: number): Promise<ShiftDto> {
		return record('HRService.handleShiftCreate', async () => {
			const metadata = stampCreate(actorId)
			const result = await db
				.insert(shiftsTable)
				.values({
					name: data.name,
					startTime: data.startTime,
					endTime: data.endTime,
					note: data.note ?? null,
					...metadata,
				})
				.returning()

			const shift = result[0] as unknown as ShiftDto
			await cache.deleteMany({ keys: ['shifts.list'] }) // Simplistic clear for shifts
			return shift
		})
	}

	/* ──────────────────── ATTENDANCE ──────────────────── */

	async handleAttendanceList(
		filter: AttendanceFilterDto,
		pq: PaginationQuery,
	): Promise<WithPaginationResult<AttendanceSelectDto>> {
		return record('HRService.handleAttendanceList', async () => {
			const { q, employeeId, locationId, status, dateFrom, dateTo } = filter

			const key = `attendance.list.${JSON.stringify(filter)}.${pq.page}.${pq.limit}`
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

					const result = await paginate({
						data: ({ limit, offset }) =>
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
								.limit(limit)
								.offset(offset),
						pq,
						countQuery: db
							.select({ count: sql<number>`count(*)` })
							.from(attendancesTable)
							.innerJoin(employeesTable, eq(attendancesTable.employeeId, employeesTable.id))
							.where(where),
					})

					return result as unknown as WithPaginationResult<AttendanceSelectDto>
				},
			})
		})
	}

	async handleClockIn(data: ClockInDto, actorId: number): Promise<AttendanceDto> {
		return record('HRService.handleClockIn', async () => {
			// Check if already clocked in (open attendance)
			const existing = await db
				.select()
				.from(attendancesTable)
				.where(
					and(
						eq(attendancesTable.employeeId, data.employeeId),
						isNull(attendancesTable.clockOut),
						isNull(attendancesTable.deletedAt),
					),
				)

			if (existing.length > 0) throw err.alreadyClockedIn(data.employeeId)

			const metadata = stampCreate(actorId)
			const result = await db
				.insert(attendancesTable)
				.values({
					employeeId: data.employeeId,
					locationId: data.locationId,
					shiftId: data.shiftId ?? null,
					note: data.note ?? null,
					date: new Date(),
					clockIn: new Date(),
					status: 'present',
					...metadata,
				})
				.returning()

			const attendance = result[0] as unknown as AttendanceDto
			await cache.deleteMany({ keys: ['attendance.list'] })
			return attendance
		})
	}

	async handleClockOut(data: ClockOutDto, actorId: number): Promise<AttendanceDto> {
		return record('HRService.handleClockOut', async () => {
			const result = await db
				.select()
				.from(attendancesTable)
				.where(and(eq(attendancesTable.id, data.id), isNull(attendancesTable.deletedAt)))

			const attendance = takeFirstOrThrow(
				result,
				`Attendance with ID ${data.id} not found`,
				'ATTENDANCE_NOT_FOUND',
			)

			if (!attendance.clockIn) throw err.notClockedIn(data.id)
			if (attendance.clockOut) throw err.alreadyClockedOut(data.id)

			const metadata = stampUpdate(actorId)
			const updateResult = await db
				.update(attendancesTable)
				.set({ clockOut: new Date(), note: data.note ?? (attendance.note as any), ...metadata })
				.where(eq(attendancesTable.id, data.id))
				.returning()

			const attendanceResult = updateResult[0] as unknown as AttendanceDto
			await cache.deleteMany({ keys: ['attendance.list'] })
			return attendanceResult
		})
	}
}
