/**
 * Unit tests for AccountService.
 *
 * These run WITHOUT a database. The service depends on the `IAccountRepo`
 * port, so we pass a typed in-memory fake (no `as any`). The only infra seam
 * that still touches a `db` is `checkConflict`, so the fake repo exposes a
 * tiny `db` stub whose `select(...).from(...).where(...).limit(...)` resolves
 * to "no conflict".
 */

import type { DbContext } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import type {
	AccountDto,
	AccountFilterDto,
	AccountCreateDto,
	AccountUpdateDto,
} from '@/modules/finance/account/account.contract'
import type { IAccountRepo } from '@/modules/finance/account/account.repo'
import { AccountService } from '@/modules/finance/account/account.service'

import { createMockCacheClient } from '../helpers/mock-db'
import { beforeEach, describe, expect, test } from 'bun:test'

async function expectReject(promise: Promise<unknown>): Promise<void> {
	let threw = false
	try {
		await promise
	} catch {
		threw = true
	}
	expect(threw).toBe(true)
}

const noConflictDb = {
	select: () => ({
		from: () => ({
			where: () => ({
				limit: async () => [] as { id: number }[],
			}),
		}),
	}),
} as unknown as DbContext

class FakeAccountRepo implements IAccountRepo {
	readonly db = noConflictDb
	store = new Map<number, AccountDto>()
	private seq = 0

	seed(rows: AccountDto[]): void {
		for (const r of rows) {
			this.store.set(r.id, r)
			this.seq = Math.max(this.seq, r.id)
		}
	}

	async findMany(_filter?: Partial<AccountFilterDto>): Promise<AccountDto[]> {
		return [...this.store.values()]
	}

	async findPage(filter: AccountFilterDto): Promise<WithPaginationResult<AccountDto>> {
		const data = [...this.store.values()]
		const limit = filter.limit ?? 10
		return {
			data,
			meta: {
				total: data.length,
				page: filter.page ?? 1,
				limit,
				totalPages: Math.max(1, Math.ceil(data.length / limit)),
			},
		}
	}

	async findById(id: number): Promise<AccountDto | undefined> {
		return this.store.get(id)
	}

	async findByCode(code: string): Promise<AccountDto | undefined> {
		for (const account of this.store.values()) {
			if (account.code === code) return account
		}
		return undefined
	}

	async hasChildren(id: number): Promise<boolean> {
		for (const account of this.store.values()) {
			if (account.parentId === id) return true
		}
		return false
	}

	async insert(data: Parameters<IAccountRepo['insert']>[0]): Promise<EntityRef | undefined> {
		const id = ++this.seq
		this.store.set(id, { ...(data as unknown as AccountDto), id })
		return { id }
	}

	async update(
		id: number,
		data: Parameters<IAccountRepo['update']>[1],
	): Promise<EntityRef | undefined> {
		const existing = this.store.get(id)
		if (!existing) return undefined
		this.store.set(id, { ...existing, ...(data as Partial<AccountDto>), id })
		return { id }
	}

	async remove(id: number): Promise<EntityRef | undefined> {
		if (!this.store.has(id)) return undefined
		this.store.delete(id)
		return { id }
	}
}

function makeAccount(overrides: Partial<AccountDto> = {}): AccountDto {
	return {
		id: 1,
		code: 'ACC-001',
		name: 'Cash Account',
		type: 'ASSET',
		isGroup: false,
		parentId: null,
		createdBy: 1,
		updatedBy: 1,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}
}

describe('AccountService (unit)', () => {
	let repo: FakeAccountRepo
	let service: AccountService

	beforeEach(() => {
		repo = new FakeAccountRepo()
		service = new AccountService(repo, createMockCacheClient() as never)
	})

	describe('handleDetail', () => {
		test('returns the account when it exists', async () => {
			repo.seed([makeAccount({ id: 1 })])
			const result = await service.handleDetail(1)
			expect(result.id).toBe(1)
			expect(result.code).toBe('ACC-001')
		})

		test('throws NotFound when missing', async () => {
			await expectReject(service.handleDetail(999))
		})
	})

	describe('handleCreate', () => {
		test('creates and returns a ref, applying the audit stamp', async () => {
			const actor = 7
			const data: AccountCreateDto = {
				code: 'ACC-NEW',
				name: 'New Account',
				type: 'ASSET',
				isGroup: false,
				parentId: null,
			}
			const result = await service.handleCreate(data, actor)

			expect(result.id).toBeDefined()
			const stored = await repo.findById(result.id)
			expect(stored?.code).toBe('ACC-NEW')
			expect(stored?.createdBy).toBe(actor)
		})
	})

	describe('handleUpdate', () => {
		test('updates an existing account and stamps updatedBy', async () => {
			repo.seed([makeAccount({ id: 1, name: 'Old' })])

			const dto: AccountUpdateDto = {
				id: 1,
				code: 'ACC-001',
				name: 'Updated',
				type: 'ASSET',
				isGroup: false,
				parentId: null,
			}
			const result = await service.handleUpdate(dto, 9)

			expect(result.id).toBe(1)
			const stored = await repo.findById(1)
			expect(stored?.name).toBe('Updated')
			expect(stored?.updatedBy).toBe(9)
		})

		test('throws NotFound when updating a missing account', async () => {
			const dto: AccountUpdateDto = {
				id: 404,
				code: 'X',
				name: 'X',
				type: 'ASSET',
				isGroup: false,
				parentId: null,
			}
			await expectReject(service.handleUpdate(dto, 1))
		})
	})

	describe('handleRemove', () => {
		test('removes an existing account', async () => {
			repo.seed([makeAccount({ id: 1 })])
			const result = await service.handleRemove(1, 1)
			expect(result.id).toBe(1)
			expect(await repo.findById(1)).toBeUndefined()
		})

		test('throws NotFound when deleting a missing account', async () => {
			await expectReject(service.handleRemove(999, 1))
		})

		test('throws error when account has children', async () => {
			repo.seed([
				makeAccount({ id: 1, code: 'PARENT' }),
				makeAccount({ id: 2, parentId: 1 }),
			])
			await expectReject(service.handleRemove(1, 1))
		})
	})

	describe('handleList', () => {
		test('returns a paginated list', async () => {
			repo.seed([makeAccount({ id: 1 }), makeAccount({ id: 2, code: 'ACC-002' })])
			const result = await service.handleList({ page: 1, limit: 10, q: undefined })
			expect(result.data.length).toBe(2)
			expect(result.meta.total).toBe(2)
		})
	})
})
