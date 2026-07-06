import { record } from '@elysiajs/opentelemetry'

import { CacheService, type CacheClient } from '@/infra/cache'
import type { WithPaginationResult } from '@/shared/types/pagination'

import type * as dto from './leave-request.contract'
import { LeaveRequestError } from './leave-request.internal'
import type { ILeaveRequestRepo } from './leave-request.repo'

export class LeaveRequestService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: ILeaveRequestRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'hr.leave-request')
	}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getById(id: number): Promise<dto.LeaveRequestDto> {
		return record('LeaveRequestService.getById', async () => {
			const key = `byId:${id}`
			const request = await this.cache.getOrSetWithSkip({
				key,
				factory: () => this.repo.getById(id),
			})
			if (!request) throw LeaveRequestError.notFound(id)
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
			if (!request) throw LeaveRequestError.notFound(id)

			if (request.status !== 'pending') {
				throw LeaveRequestError.invalidStatus(request.status)
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
			if (!request) throw LeaveRequestError.notFound(id)

			if (request.status !== 'pending') {
				throw LeaveRequestError.invalidStatus(request.status)
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
			if (!request) throw LeaveRequestError.notFound(id)

			if (request.status !== 'pending' && request.status !== 'approved') {
				throw LeaveRequestError.invalidStatus(request.status)
			}

			const result = await this.repo.updateStatus(id, 'cancelled', actorId)
			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })
			return result
		})
	}
}
