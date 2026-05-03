import { record } from '@elysiajs/opentelemetry'

import { InternalServerError, NotFoundError } from '@/core/http/errors'
import type { WithPaginationResult } from '@/core/utils/pagination'

import { CacheService, type CacheClient } from '@/lib/cache'

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
	private readonly cache: CacheService

	constructor(
		private readonly repo: LeaveRequestRepo,
		cacheClient: CacheClient,
	) {
		this.cache = new CacheService({ ns: 'hr.leave-request', client: cacheClient })
	}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getById(id: number): Promise<dto.LeaveRequestDto> {
		return record('LeaveRequestService.getById', async () => {
			const key = `byId:${id}`
			const request = await this.cache.getOrSetSkipUndefined({
				key,
				factory: () => this.repo.getById(id),
			})
			if (!request) throw err.notFound(id)
			return request
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(
		filter: dto.LeaveRequestFilterDto,
	): Promise<WithPaginationResult<dto.LeaveRequestSelectDto>> {
		return record('LeaveRequestService.handleList', async () => {
			const key = `list.${JSON.stringify(filter)}`
			return this.cache.getOrSet({
				key,
				factory: () => this.repo.getListPaginated(filter),
			})
		})
	}

	async handleDetail(id: number): Promise<dto.LeaveRequestDto> {
		return record('LeaveRequestService.handleDetail', async () => {
			return this.getById(id)
		})
	}

	async handleCreate(data: dto.LeaveRequestCreateDto, actorId: number): Promise<{ id: number }> {
		return record('LeaveRequestService.handleCreate', async () => {
			const result = await this.repo.create(data, actorId)
			await this.cache.deleteMany({ keys: ['list', 'count'] })
			return result
		})
	}

	async handleUpdate(data: dto.LeaveRequestUpdateDto, actorId: number): Promise<{ id: number }> {
		return record('LeaveRequestService.handleUpdate', async () => {
			const result = await this.repo.update(data, actorId)
			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${data.id}`] })
			return result
		})
	}

	async handleRemove(id: number, actorId: number): Promise<{ id: number }> {
		return record('LeaveRequestService.handleRemove', async () => {
			const result = await this.repo.softDelete(id, actorId)
			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })
			return result
		})
	}

	async handleApprove(data: dto.LeaveRequestApproveDto, actorId: number): Promise<{ id: number }> {
		return record('LeaveRequestService.handleApprove', async () => {
			const { id } = data
			const request = await this.repo.getById(id)
			if (!request) throw err.notFound(id)

			if (request.status !== 'pending') {
				throw err.invalidStatus(request.status)
			}

			const result = await this.repo.updateStatus(id, 'approved', actorId)
			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })
			return result
		})
	}

	async handleReject(data: dto.LeaveRequestRejectDto, actorId: number): Promise<{ id: number }> {
		return record('LeaveRequestService.handleReject', async () => {
			const { id } = data
			const request = await this.repo.getById(id)
			if (!request) throw err.notFound(id)

			if (request.status !== 'pending') {
				throw err.invalidStatus(request.status)
			}

			const result = await this.repo.updateStatus(id, 'rejected', actorId)
			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })
			return result
		})
	}

	async handleCancel(data: dto.LeaveRequestCancelDto, actorId: number): Promise<{ id: number }> {
		return record('LeaveRequestService.handleCancel', async () => {
			const { id } = data
			const request = await this.repo.getById(id)
			if (!request) throw err.notFound(id)

			if (request.status !== 'pending' && request.status !== 'approved') {
				throw err.invalidStatus(request.status)
			}

			const result = await this.repo.updateStatus(id, 'cancelled', actorId)
			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })
			return result
		})
	}
}
