/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */
import { record } from '@elysiajs/opentelemetry'

import { ConflictError, NotFoundError } from '@/core/http/errors'
import type { PaginationQuery, WithPaginationResult } from '@/core/utils/pagination'

import { CacheService, type CacheClient } from '@/lib/cache'

import type {
	AttendanceDto,
	AttendanceFilterDto,
	AttendanceSelectDto,
	ClockInDto,
	ClockOutDto,
	ShiftCreateDto,
	ShiftDto,
} from './hr.dto'
import { HRRepo } from './hr.repo'

export class HRService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: HRRepo,
		cacheClient: CacheClient,
	) {
		this.cache = new CacheService({ ns: 'hr', client: cacheClient })
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleShiftList(pq: PaginationQuery): Promise<WithPaginationResult<ShiftDto>> {
		return record('HRService.handleShiftList', async () => {
			const key = `shifts.${pq.page}.${pq.limit}`
			return this.cache.getOrSet({
				key,
				factory: () => this.repo.getShiftListPaginated(pq.page, pq.limit),
			})
		})
	}

	async handleShiftCreate(data: ShiftCreateDto, actorId: number): Promise<ShiftDto> {
		return record('HRService.handleShiftCreate', async () => {
			const result = await this.repo.createShift(data, actorId)
			await this.cache.deleteMany({ keys: ['list', 'count'] })
			return result
		})
	}

	async handleAttendanceList(
		filter: AttendanceFilterDto,
	): Promise<WithPaginationResult<AttendanceSelectDto>> {
		return record('HRService.handleAttendanceList', async () => {
			const key = `attendance.list.${JSON.stringify(filter)}`
			return this.cache.getOrSet({
				key,
				factory: () => this.repo.getAttendanceListPaginated(filter),
			})
		})
	}

	async handleClockIn(data: ClockInDto, actorId: number): Promise<AttendanceDto> {
		return record('HRService.handleClockIn', async () => {
			const existing = await this.repo.findOpenAttendance(data.employeeId)
			if (existing)
				throw new ConflictError(
					`Employee with ID ${data.employeeId} is already clocked in`,
					'ALREADY_CLOCKED_IN',
				)

			const result = await this.repo.clockIn(data, actorId)
			await this.cache.deleteMany({ keys: ['list', 'count'] })
			return result
		})
	}

	async handleClockOut(data: ClockOutDto, actorId: number): Promise<AttendanceDto> {
		return record('HRService.handleClockOut', async () => {
			const attendance = await this.repo.getAttendanceById(data.id)
			if (!attendance)
				throw new NotFoundError(`Attendance with ID ${data.id} not found`, 'ATTENDANCE_NOT_FOUND')

			if (!attendance.clockIn)
				throw new ConflictError(`Attendance with ID ${data.id} is not clocked in`, 'NOT_CLOCKED_IN')
			if (attendance.clockOut)
				throw new ConflictError(
					`Attendance with ID ${data.id} is already clocked out`,
					'ALREADY_CLOCKED_OUT',
				)

			const result = await this.repo.clockOut(
				data.id,
				data.note ?? (attendance.note as string),
				actorId,
			) // eslint-disable-line @typescript-eslint/no-unsafe-type-assertion
			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${data.id}`] })
			return result
		})
	}
}
