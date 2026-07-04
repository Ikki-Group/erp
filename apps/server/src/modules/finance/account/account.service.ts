import { record } from '@elysiajs/opentelemetry'

import { accountsTable } from '@/db/schema/finance'
import { CacheService, type CacheClient } from '@/infra/cache'
import { checkConflict, type ConflictField, withTransaction } from '@/infra/database'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { ActorId, EntityRef } from '@/shared/types/utils'

import type {
	AccountDto,
	AccountCreateDto,
	AccountUpdateDto,
	AccountFilterDto,
} from './account.contract'
import { AccountError } from './account.internal'
import type { IAccountRepo } from './account.repo'

const uniqueFields: ConflictField<{ code: string }>[] = [
	{
		field: 'code',
		column: accountsTable.code,
		message: 'Account code already exists',
		code: 'ACCOUNT_CODE_ALREADY_EXISTS',
	},
]

export class AccountService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: IAccountRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'finance.account')
	}

	private async invalidate(id?: number): Promise<void> {
		const keys = [this.cache.keys.list, this.cache.keys.count]
		if (id !== undefined) keys.push(this.cache.keys.byId(id))
		await this.cache.deleteFromKeys(keys)
	}

	async getByCode(code: string): Promise<AccountDto | undefined> {
		return record('AccountService.getByCode', async () =>
			this.cache.getOrSetWithSkip({
				key: `code:${code}`,
				factory: () => this.repo.findByCode(code),
			}),
		)
	}

	async handleList(query: AccountFilterDto): Promise<WithPaginationResult<AccountDto>> {
		return record('AccountService.handleList', async () => this.repo.findPage(query))
	}

	async handleDetail(id: number): Promise<AccountDto> {
		return record('AccountService.handleDetail', async () => {
			const result = await this.repo.findById(id)
			if (!result) throw AccountError.notFound(id)
			return result
		})
	}

	async handleCreate(data: AccountCreateDto, actorId: ActorId): Promise<EntityRef> {
		return record('AccountService.handleCreate', async () => {
			await checkConflict({
				db: this.repo.db,
				table: accountsTable,
				pkColumn: accountsTable.id,
				fields: uniqueFields,
				input: data,
			})

			const result = await this.repo.insert({
				...data,
				...stampCreate(actorId),
			})
			if (!result) throw AccountError.createFailed()

			await this.invalidate()
			return result
		})
	}

	async handleUpdate(data: AccountUpdateDto, actorId: ActorId): Promise<EntityRef> {
		return record('AccountService.handleUpdate', async () => {
			const { id } = data
			const existing = await this.repo.findById(id)
			if (!existing) throw AccountError.notFound(id)

			await checkConflict({
				db: this.repo.db,
				table: accountsTable,
				pkColumn: accountsTable.id,
				fields: uniqueFields,
				input: data,
				existing,
			})

			const result = await this.repo.update(id, {
				...data,
				...stampUpdate(actorId),
			})
			if (!result) throw AccountError.updateFailed(id)

			await this.invalidate(id)
			return result
		})
	}

	async handleRemove(id: number, _actorId: ActorId): Promise<EntityRef> {
		return record('AccountService.handleRemove', async () => {
			const hasChildren = await this.repo.hasChildren(id)
			if (hasChildren) throw AccountError.hasChildren(id)

			const result = await withTransaction(this.repo.db, async (tx) => {
				return this.repo.remove(id, tx)
			})
			if (!result) throw AccountError.notFound(id)

			await this.invalidate(id)
			return result
		})
	}
}
