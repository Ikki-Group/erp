import { record } from '@elysiajs/opentelemetry'

import { ConflictError, NotFoundError } from '@/core/http/errors'
import type { PaginationQuery, WithPaginationResult } from '@/core/utils/pagination'

import type {
	AttendanceDto,
	AttendanceFilterDto,
	AttendanceSelectDto,
	ClockInDto,
	ClockOutDto,
	ShiftCreateDto,
	ShiftDto,
} from '../dto/hr.dto'
import { HRRepo } from '../repo/hr.repo'

export class HRService {
	constructor(private readonly repo = new HRRepo()) {}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleShiftList(pq: PaginationQuery): Promise<WithPaginationResult<ShiftDto>> {
		return record('HRService.handleShiftList', async () => {
			return this.repo.getShiftListPaginated(pq.page, pq.limit)
		})
	}

	async handleShiftCreate(data: ShiftCreateDto, actorId: number): Promise<ShiftDto> {
		return record('HRService.handleShiftCreate', async () => {
			return this.repo.createShift(data, actorId)
		})
	}

	async handleAttendanceList(
		filter: AttendanceFilterDto,
	): Promise<WithPaginationResult<AttendanceSelectDto>> {
		return record('HRService.handleAttendanceList', async () => {
			return this.repo.getAttendanceListPaginated(filter)
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

			return this.repo.clockIn(data, actorId)
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

			return this.repo.clockOut(data.id, data.note ?? (attendance.note as string), actorId)
		})
	}
}
