import { beforeEach, describe, expect, it, spyOn } from 'bun:test'

import { HRService } from './hr.service'
import { HRRepo } from './hr.repo'
import { ConflictError, NotFoundError } from '@/core/http/errors'
import * as dto from './hr.dto'

describe('HRService', () => {
	let service: HRService
	let fakeRepo: HRRepo

	beforeEach(() => {
		fakeRepo = {
			getShiftListPaginated: spyOn(),
			createShift: spyOn(),
			getAttendanceListPaginated: spyOn(),
			findOpenAttendance: spyOn(),
			clockIn: spyOn(),
			getAttendanceById: spyOn(),
			clockOut: spyOn(),
		} as any

		service = new HRService(fakeRepo)
	})

	describe('handleShiftList', () => {
		it('should return paginated shift list', async () => {
			const pagination = { page: 1, limit: 10 }
			const mockPaginatedResult = {
				data: [
					{
						id: 1,
						name: 'Morning Shift',
						startTime: '08:00',
						endTime: '16:00',
						isActive: true,
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				],
				meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
			}

			spyOn(fakeRepo, 'getShiftListPaginated').mockResolvedValue(mockPaginatedResult)

			const result = await service.handleShiftList(pagination)

			expect(fakeRepo.getShiftListPaginated).toHaveBeenCalledWith(1, 10)
			expect(result).toEqual(mockPaginatedResult)
		})
	})

	describe('handleShiftCreate', () => {
		it('should create shift successfully', async () => {
			const shiftData: dto.ShiftCreateDto = {
				name: 'Evening Shift',
				startTime: '16:00',
				endTime: '00:00',
				isActive: true,
			}

			const actorId = 1
			const mockShift: dto.ShiftDto = {
				id: 2,
				...shiftData,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			spyOn(fakeRepo, 'createShift').mockResolvedValue(mockShift)

			const result = await service.handleShiftCreate(shiftData, actorId)

			expect(fakeRepo.createShift).toHaveBeenCalledWith(shiftData, actorId)
			expect(result).toEqual(mockShift)
		})
	})

	describe('handleAttendanceList', () => {
		it('should return paginated attendance list', async () => {
			const filter: dto.AttendanceFilterDto = {
				employeeId: 1,
				date: new Date(),
				page: 1,
				limit: 10,
			}

			const mockPaginatedResult = {
				data: [
					{
						id: 1,
						employeeId: 1,
						employee: { id: 1, name: 'John Doe' },
						date: new Date(),
						clockIn: new Date(),
						clockOut: null,
						note: null,
						shift: { id: 1, name: 'Morning Shift' },
					},
				],
				meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
			}

			spyOn(fakeRepo, 'getAttendanceListPaginated').mockResolvedValue(mockPaginatedResult)

			const result = await service.handleAttendanceList(filter)

			expect(fakeRepo.getAttendanceListPaginated).toHaveBeenCalledWith(filter)
			expect(result).toEqual(mockPaginatedResult)
		})
	})

	describe('handleClockIn', () => {
		it('should clock in employee successfully', async () => {
			const clockInData: dto.ClockInDto = {
				employeeId: 1,
				date: new Date(),
				shiftId: 1,
				note: 'Starting work',
			}

			const actorId = 1
			const mockAttendance: dto.AttendanceDto = {
				id: 1,
				employeeId: 1,
				date: new Date(),
				clockIn: new Date(),
				clockOut: null,
				note: 'Starting work',
				shiftId: 1,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			spyOn(fakeRepo, 'findOpenAttendance').mockResolvedValue(null)
			spyOn(fakeRepo, 'clockIn').mockResolvedValue(mockAttendance)

			const result = await service.handleClockIn(clockInData, actorId)

			expect(fakeRepo.findOpenAttendance).toHaveBeenCalledWith(1)
			expect(fakeRepo.clockIn).toHaveBeenCalledWith(clockInData, actorId)
			expect(result).toEqual(mockAttendance)
		})

		it('should throw ConflictError when employee already clocked in', async () => {
			const clockInData: dto.ClockInDto = {
				employeeId: 1,
				date: new Date(),
				shiftId: 1,
			}

			const actorId = 1
			const existingAttendance: dto.AttendanceDto = {
				id: 1,
				employeeId: 1,
				date: new Date(),
				clockIn: new Date(),
				clockOut: null,
				note: null,
				shiftId: 1,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			spyOn(fakeRepo, 'findOpenAttendance').mockResolvedValue(existingAttendance)

			await expect(service.handleClockIn(clockInData, actorId)).rejects.toThrow(
				new ConflictError('Employee with ID 1 is already clocked in', 'ALREADY_CLOCKED_IN')
			)

			expect(fakeRepo.clockIn).not.toHaveBeenCalled()
		})
	})

	describe('handleClockOut', () => {
		it('should clock out employee successfully', async () => {
			const clockOutData: dto.ClockOutDto = {
				id: 1,
				note: 'Finished work',
			}

			const actorId = 1
			const existingAttendance: dto.AttendanceDto = {
				id: 1,
				employeeId: 1,
				date: new Date(),
				clockIn: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
				clockOut: null,
				note: 'Starting work',
				shiftId: 1,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			const updatedAttendance: dto.AttendanceDto = {
				...existingAttendance,
				clockOut: new Date(),
				note: 'Finished work',
				updatedAt: new Date(),
			}

			spyOn(fakeRepo, 'getAttendanceById').mockResolvedValue(existingAttendance)
			spyOn(fakeRepo, 'clockOut').mockResolvedValue(updatedAttendance)

			const result = await service.handleClockOut(clockOutData, actorId)

			expect(fakeRepo.getAttendanceById).toHaveBeenCalledWith(1)
			expect(fakeRepo.clockOut).toHaveBeenCalledWith(1, 'Finished work', actorId)
			expect(result).toEqual(updatedAttendance)
		})

		it('should use existing note when no new note provided', async () => {
			const clockOutData: dto.ClockOutDto = {
				id: 1,
			}

			const actorId = 1
			const existingAttendance: dto.AttendanceDto = {
				id: 1,
				employeeId: 1,
				date: new Date(),
				clockIn: new Date(Date.now() - 8 * 60 * 60 * 1000),
				clockOut: null,
				note: 'Starting work',
				shiftId: 1,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			spyOn(fakeRepo, 'getAttendanceById').mockResolvedValue(existingAttendance)
			spyOn(fakeRepo, 'clockOut').mockResolvedValue({
				...existingAttendance,
				clockOut: new Date(),
			})

			await service.handleClockOut(clockOutData, actorId)

			expect(fakeRepo.clockOut).toHaveBeenCalledWith(1, 'Starting work', actorId)
		})

		it('should throw NotFoundError when attendance not found', async () => {
			const clockOutData: dto.ClockOutDto = {
				id: 999,
			}

			const actorId = 1

			spyOn(fakeRepo, 'getAttendanceById').mockResolvedValue(undefined)

			await expect(service.handleClockOut(clockOutData, actorId)).rejects.toThrow(
				new NotFoundError('Attendance with ID 999 not found', 'ATTENDANCE_NOT_FOUND')
			)

			expect(fakeRepo.clockOut).not.toHaveBeenCalled()
		})

		it('should throw ConflictError when not clocked in', async () => {
			const clockOutData: dto.ClockOutDto = {
				id: 1,
			}

			const actorId = 1
			const existingAttendance: dto.AttendanceDto = {
				id: 1,
				employeeId: 1,
				date: new Date(),
				clockIn: null,
				clockOut: null,
				note: null,
				shiftId: 1,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			spyOn(fakeRepo, 'getAttendanceById').mockResolvedValue(existingAttendance)

			await expect(service.handleClockOut(clockOutData, actorId)).rejects.toThrow(
				new ConflictError('Attendance with ID 1 is not clocked in', 'NOT_CLOCKED_IN')
			)

			expect(fakeRepo.clockOut).not.toHaveBeenCalled()
		})

		it('should throw ConflictError when already clocked out', async () => {
			const clockOutData: dto.ClockOutDto = {
				id: 1,
			}

			const actorId = 1
			const existingAttendance: dto.AttendanceDto = {
				id: 1,
				employeeId: 1,
				date: new Date(),
				clockIn: new Date(Date.now() - 8 * 60 * 60 * 1000),
				clockOut: new Date(),
				note: 'Finished work',
				shiftId: 1,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			spyOn(fakeRepo, 'getAttendanceById').mockResolvedValue(existingAttendance)

			await expect(service.handleClockOut(clockOutData, actorId)).rejects.toThrow(
				new ConflictError('Attendance with ID 1 is already clocked out', 'ALREADY_CLOCKED_OUT')
			)

			expect(fakeRepo.clockOut).not.toHaveBeenCalled()
		})
	})
})
