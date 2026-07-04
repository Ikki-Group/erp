/**
 * Unit tests for AuditLogService.
 *
 * These run WITHOUT a database. The service depends on the `IAuditLogRepo`
 * port, so we pass a typed in-memory fake (no `as any`).
 */

import type { DbContext } from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { EntityRef } from '@/shared/types/utils'

import type { AuditLogDto, AuditLogFilterDto, AuditLogCreateDto } from '@/modules/audit/audit-log.contract'
import type { IAuditLogRepo } from '@/modules/audit/audit-log.repo'
import { AuditLogService } from '@/modules/audit/audit-log.service'

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

class FakeAuditLogRepo implements IAuditLogRepo {
	readonly db = noConflictDb
	store = new Map<number, AuditLogDto>()
	private seq = 0

	seed(rows: AuditLogDto[]): void {
		for (const r of rows) {
			this.store.set(r.id, r)
			this.seq = Math.max(this.seq, r.id)
		}
	}

	async findPage(filter: AuditLogFilterDto): Promise<WithPaginationResult<AuditLogDto>> {
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

	async findById(id: number): Promise<AuditLogDto | undefined> {
		return this.store.get(id)
	}

	async insert(data: AuditLogCreateDto): Promise<EntityRef | undefined> {
		const id = ++this.seq
		this.store.set(id, {
			id,
			userId: data.userId,
			action: data.action,
			entityType: data.entityType,
			entityId: data.entityId ?? null,
			description: data.description,
			oldValue: data.oldValue ?? null,
			newValue: data.newValue ?? null,
			ipAddress: data.ipAddress ?? null,
			userAgent: data.userAgent ?? null,
			actionAt: new Date(),
		})
		return { id }
	}
}

function makeAuditLog(overrides: Partial<AuditLogDto> = {}): AuditLogDto {
	return {
		id: 1,
		userId: 1,
		action: 'CREATE',
		entityType: 'location',
		entityId: '1',
		description: 'Created location',
		oldValue: null,
		newValue: { name: 'Warehouse 1' },
		ipAddress: '127.0.0.1',
		userAgent: 'test',
		actionAt: new Date(),
		...overrides,
	}
}

describe('AuditLogService (unit)', () => {
	let repo: FakeAuditLogRepo
	let service: AuditLogService

	beforeEach(() => {
		repo = new FakeAuditLogRepo()
		service = new AuditLogService(repo, createMockCacheClient() as never)
	})

	describe('handleDetail', () => {
		test('returns the audit log when it exists', async () => {
			repo.seed([makeAuditLog({ id: 1 })])
			const result = await service.handleDetail(1)
			expect(result.id).toBe(1)
			expect(result.action).toBe('CREATE')
		})

		test('throws NotFound when missing', async () => {
			await expectReject(service.handleDetail(999))
		})
	})

	describe('handleCreate', () => {
		test('creates and returns a ref', async () => {
			const actor = 7
			const result = await service.handleCreate({
				userId: actor,
				action: 'UPDATE',
				entityType: 'location',
				entityId: '2',
				description: 'Updated location',
				oldValue: { name: 'Old' },
				newValue: { name: 'New' },
			})

			expect(result.id).toBeDefined()
			const stored = await repo.findById(result.id)
			expect(stored?.action).toBe('UPDATE')
			expect(stored?.userId).toBe(actor)
		})
	})

	describe('handleList', () => {
		test('returns a paginated list', async () => {
			repo.seed([makeAuditLog({ id: 1 }), makeAuditLog({ id: 2, action: 'DELETE' })])
			const result = await service.handleList({ page: 1, limit: 10, q: undefined })
			expect(result.data.length).toBe(2)
			expect(result.meta.total).toBe(2)
		})
	})
})
