import { record } from '@elysiajs/opentelemetry'

import { NotFoundError } from '@/core/http/errors'
import type { WithPaginationResult } from '@/core/utils/pagination'

import { CacheService, type CacheClient } from '@/lib/cache'

import type * as dto from './session.dto'
import { SessionRepo } from './session.repo'

const err = {
	notFound: (id: number) =>
		new NotFoundError(`Session with ID ${id} not found`, 'SESSION_NOT_FOUND'),
}

export class SessionService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: SessionRepo,
		cacheClient: CacheClient,
	) {
		this.cache = new CacheService({ ns: 'iam.session', client: cacheClient })
	}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getById(id: number): Promise<dto.SessionDto> {
		return record('SessionService.getById', async () => {
			const session = await this.cache.getOrSetSkipUndefined({
				key: `byId:${id}`,
				factory: () => this.repo.getById(id),
			})
			if (!session) throw err.notFound(id)
			return session
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(
		filter: dto.SessionFilterDto,
	): Promise<WithPaginationResult<dto.SessionSelectDto>> {
		return record('SessionService.handleList', async () => {
			return this.repo.getListPaginated(filter)
		})
	}

	async handleDetail(id: number): Promise<dto.SessionDto> {
		return record('SessionService.handleDetail', async () => {
			return this.getById(id)
		})
	}

	async handleGetByUserId(userId: number): Promise<dto.SessionDto[]> {
		return record('SessionService.handleGetByUserId', async () => {
			return this.repo.getByUserId(userId)
		})
	}

	async handleGetActiveByUserId(userId: number): Promise<dto.SessionDto[]> {
		return record('SessionService.handleGetActiveByUserId', async () => {
			return this.repo.getActiveByUserId(userId)
		})
	}

	async handleInvalidate(data: dto.SessionInvalidateDto): Promise<void> {
		return record('SessionService.handleInvalidate', async () => {
			await this.repo.deleteMany(data.sessionIds)
			await this.cache.deleteMany({ keys: ['list', 'count'] })
		})
	}

	async handleInvalidateAll(data: dto.SessionInvalidateAllDto): Promise<void> {
		return record('SessionService.handleInvalidateAll', async () => {
			const { userId, exceptCurrentSessionId } = data

			if (exceptCurrentSessionId) {
				await this.repo.deleteByUserIdExcept(userId, exceptCurrentSessionId)
			} else {
				await this.repo.deleteByUserId(userId)
			}

			await this.cache.deleteMany({ keys: ['list', 'count'] })
		})
	}

	async handleInvalidateExpired(): Promise<void> {
		return record('SessionService.handleInvalidateExpired', async () => {
			await this.repo.deleteExpired()
			await this.cache.deleteMany({ keys: ['list', 'count'] })
		})
	}

	async handleRefreshExpiry(id: number, newExpiredAt: Date): Promise<{ id: number }> {
		return record('SessionService.handleRefreshExpiry', async () => {
			const session = await this.getById(id)
			if (!session) throw err.notFound(id)

			const result = await this.repo.refreshExpiry(id, newExpiredAt)

			await this.cache.deleteMany({ keys: [`byId:${id}`] })

			return result
		})
	}
}
