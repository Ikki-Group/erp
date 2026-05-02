import { record } from '@elysiajs/opentelemetry'

import { InternalServerError, NotFoundError } from '@/core/http/errors'
import type { WithPaginationResult } from '@/core/utils/pagination'

import type * as dto from './leave-request.dto'
import { LeaveRequestRepo } from './leave-request.repo'

const err = {
	notFound: (id: number) =>
		new NotFoundError(`Leave request with ID ${id} not found`, 'LEAVE_REQUEST_NOT_FOUND'),
	invalidStatus: (currentStatus: string) =>
		new InternalServerError(
			`Cannot approve/reject/cancel leave request with status ${currentStatus}`,
			'INVALID_LEAVE_STATUS',
		),
}

export class LeaveRequestService {
	constructor(private readonly repo: LeaveRequestRepo) {}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getById(id: number): Promise<dto.LeaveRequestDto> {
		return record('LeaveRequestService.getById', async () => {
			const request = await this.repo.getById(id)
			if (!request) throw err.notFound(id)
			return request
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(
		filter: dto.LeaveRequestFilterDto,
	): Promise<WithPaginationResult<dto.LeaveRequestSelectDto>> {
		return record('LeaveRequestService.handleList', async () => {
			return this.repo.getListPaginated(filter)
		})
	}

	async handleDetail(id: number): Promise<dto.LeaveRequestDto> {
		return record('LeaveRequestService.handleDetail', async () => {
			return this.getById(id)
		})
	}

	async handleCreate(data: dto.LeaveRequestCreateDto, actorId: number): Promise<{ id: number }> {
		return record('LeaveRequestService.handleCreate', async () => {
			return this.repo.create(data, actorId)
		})
	}

	async handleUpdate(data: dto.LeaveRequestUpdateDto, actorId: number): Promise<{ id: number }> {
		return record('LeaveRequestService.handleUpdate', async () => {
			return this.repo.update(data, actorId)
		})
	}

	async handleRemove(id: number, actorId: number): Promise<{ id: number }> {
		return record('LeaveRequestService.handleRemove', async () => {
			return this.repo.softDelete(id, actorId)
		})
	}

	async handleApprove(
		data: dto.LeaveRequestApproveDto,
		actorId: number,
	): Promise<{ id: number }> {
		return record('LeaveRequestService.handleApprove', async () => {
			const { id } = data
			const request = await this.repo.getById(id)
			if (!request) throw err.notFound(id)

			// Can only approve if status is 'pending'
			if (request.status !== 'pending') {
				throw err.invalidStatus(request.status)
			}

			return this.repo.updateStatus(id, 'approved', actorId)
		})
	}

	async handleReject(
		data: dto.LeaveRequestRejectDto,
		actorId: number,
	): Promise<{ id: number }> {
		return record('LeaveRequestService.handleReject', async () => {
			const { id } = data
			const request = await this.repo.getById(id)
			if (!request) throw err.notFound(id)

			// Can only reject if status is 'pending'
			if (request.status !== 'pending') {
				throw err.invalidStatus(request.status)
			}

			return this.repo.updateStatus(id, 'rejected', actorId)
		})
	}

	async handleCancel(
		data: dto.LeaveRequestCancelDto,
		actorId: number,
	): Promise<{ id: number }> {
		return record('LeaveRequestService.handleCancel', async () => {
			const { id } = data
			const request = await this.repo.getById(id)
			if (!request) throw err.notFound(id)

			// Can only cancel if status is 'pending' or 'approved'
			if (request.status !== 'pending' && request.status !== 'approved') {
				throw err.invalidStatus(request.status)
			}

			return this.repo.updateStatus(id, 'cancelled', actorId)
		})
	}
}
