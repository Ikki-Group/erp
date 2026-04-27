import { record } from '@elysiajs/opentelemetry'

import { NotFoundError } from '@/core/http/errors'
import type { WithPaginationResult } from '@/core/utils/pagination'

import {
	AccountDto,
	AccountCreateDto,
	AccountUpdateDto,
	AccountFilterDto,
} from '../dto/account.dto'
import { AccountRepo } from '../repo/account.repo'

export class AccountService {
	constructor(private readonly repo = new AccountRepo()) {}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getById(id: number) {
		return record('AccountService.getById', async () => {
			const account = await this.repo.getById(id)
			if (!account) throw new NotFoundError(`Account ${id} not found`, 'ACCOUNT_NOT_FOUND')
			return account
		})
	}

	async findByCode(code: string) {
		return record('AccountService.findByCode', async () => {
			return this.repo.findByCode(code)
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
			return this.repo.create(data, actorId)
		})
	}

	async handleUpdate(id: number, data: AccountUpdateDto, actorId: number) {
		return record('AccountService.handleUpdate', async () => {
			return this.repo.update(id, data, actorId)
		})
	}

	async handleRemove(id: number, actorId: number) {
		return record('AccountService.handleRemove', async () => {
			const hasChildren = await this.repo.hasChildren(id)
			if (hasChildren) {
				throw new Error('Account has children, cannot delete')
			}
			return this.repo.softDelete(id, actorId)
		})
	}
}
