import { record } from '@elysiajs/opentelemetry'

import { NotFoundError } from '@/core/http/errors'
import type { WithPaginationResult } from '@/core/utils/pagination'

import { CacheService, type CacheClient } from '@/lib/cache'

import { AccountDto, AccountCreateDto, AccountUpdateDto, AccountFilterDto } from './account.dto'
import { AccountRepo } from './account.repo'

export class AccountService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: AccountRepo,
		cacheClient: CacheClient,
	) {
		this.cache = new CacheService({ ns: 'finance.account', client: cacheClient })
	}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getById(id: number) {
		return record('AccountService.getById', async () => {
			const account = await this.cache.getOrSetSkipUndefined({
				key: `byId:${id}`,
				factory: () => this.repo.getById(id),
			})
			if (!account) throw new NotFoundError(`Account ${id} not found`, 'ACCOUNT_NOT_FOUND')
			return account
		})
	}

	async findByCode(code: string) {
		return record('AccountService.findByCode', async () => {
			return this.cache.getOrSetSkipUndefined({
				key: `code:${code}`,
				factory: () => this.repo.findByCode(code),
			})
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(query: AccountFilterDto): Promise<WithPaginationResult<AccountDto>> {
		return record('AccountService.handleList', async () => {
			return this.repo.getListPaginated(query)
		})
	}

	async handleDetail(id: number) {
		return record('AccountService.handleDetail', async () => {
			return this.getById(id)
		})
	}

	async handleCreate(data: AccountCreateDto, actorId: number) {
		return record('AccountService.handleCreate', async () => {
			const result = await this.repo.create(data, actorId)
			await this.cache.deleteMany({ keys: ['list', 'count'] })
			return result
		})
	}

	async handleUpdate(id: number, data: AccountUpdateDto, actorId: number) {
		return record('AccountService.handleUpdate', async () => {
			const result = await this.repo.update(id, data, actorId)
			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`, `code:${data.code}`] })
			return result
		})
	}

	async handleRemove(id: number, actorId: number) {
		return record('AccountService.handleRemove', async () => {
			const hasChildren = await this.repo.hasChildren(id)
			if (hasChildren) {
				throw new Error('Account has children, cannot delete')
			}
			const result = await this.repo.softDelete(id, actorId)
			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })
			return result
		})
	}
}
