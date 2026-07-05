/**
 * Unit tests for CompanySettingsService.
 *
 * These run WITHOUT a database. The service depends on the `ICompanySettingsRepo`
 * port, so we pass a typed in-memory fake.
 */

import type { DbContext } from '@/infra/database'
import type { EntityRef } from '@/shared/types/utils'

import type { CompanySettingsDto } from '@/modules/company/settings/settings.contract'
import type { ICompanySettingsRepo } from '@/modules/company/settings/settings.repo'
import { CompanySettingsService } from '@/modules/company/settings/settings.service'

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

class FakeCompanySettingsRepo {
	readonly db = noConflictDb
	private store: CompanySettingsDto | undefined
	private seq = 0

	seed(data: CompanySettingsDto): void {
		this.store = data
		this.seq = Math.max(this.seq, data.id)
	}

	async get(): Promise<CompanySettingsDto | undefined> {
		return this.store
	}

	async findById(id: number): Promise<CompanySettingsDto | undefined> {
		if (!this.store || this.store.id !== id) return undefined
		return this.store
	}

	async insert(data: Record<string, unknown>): Promise<EntityRef | undefined> {
		const id = ++this.seq
		const now = new Date()
		this.store = {
			id,
			name: (data.name as string) ?? 'Default',
			address: (data.address as string | null) ?? null,
			phone: (data.phone as string | null) ?? null,
			email: (data.email as string | null) ?? null,
			taxId: (data.taxId as string | null) ?? null,
			taxRate: (data.taxRate as string) ?? '0',
			logoUrl: (data.logoUrl as string | null) ?? null,
			invoiceFooter: (data.invoiceFooter as string | null) ?? null,
			receiptFooter: (data.receiptFooter as string | null) ?? null,
			currencyCode: (data.currencyCode as string) ?? 'IDR',
			currencySymbol: (data.currencySymbol as string) ?? 'Rp',
			settings: data.settings ?? null,
			createdAt: (data.createdAt as Date) ?? now,
			updatedAt: (data.updatedAt as Date) ?? now,
			createdBy: (data.createdBy as number) ?? 1,
			updatedBy: (data.updatedBy as number) ?? 1,
		}
		return { id }
	}

	async update(id: number, data: Record<string, unknown>): Promise<EntityRef | undefined> {
		if (!this.store || this.store.id !== id) return undefined
		const now = new Date()
		this.store = {
			...this.store,
			name: (data.name as string | undefined) ?? this.store.name,
			address: (data.address as string | null | undefined) ?? this.store.address,
			phone: (data.phone as string | null | undefined) ?? this.store.phone,
			email: (data.email as string | null | undefined) ?? this.store.email,
			taxId: (data.taxId as string | null | undefined) ?? this.store.taxId,
			taxRate: (data.taxRate as string | undefined) ?? this.store.taxRate,
			logoUrl: (data.logoUrl as string | null | undefined) ?? this.store.logoUrl,
			invoiceFooter: (data.invoiceFooter as string | null | undefined) ?? this.store.invoiceFooter,
			receiptFooter: (data.receiptFooter as string | null | undefined) ?? this.store.receiptFooter,
			currencyCode: (data.currencyCode as string | undefined) ?? this.store.currencyCode,
			currencySymbol: (data.currencySymbol as string | undefined) ?? this.store.currencySymbol,
			settings: data.settings ?? this.store.settings,
			updatedBy: (data.updatedBy as number) ?? this.store.updatedBy,
			updatedAt: (data.updatedAt as Date) ?? now,
			id,
		}
		return { id }
	}
}

function makeCompanySettings(overrides: Partial<CompanySettingsDto> = {}): CompanySettingsDto {
	return {
		id: 1,
		name: 'Test Company',
		address: null,
		phone: null,
		email: null,
		taxId: null,
		taxRate: '0',
		logoUrl: null,
		invoiceFooter: null,
		receiptFooter: null,
		currencyCode: 'IDR',
		currencySymbol: 'Rp',
		settings: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		createdBy: 1,
		updatedBy: 1,
		...overrides,
	}
}

describe('CompanySettingsService (unit)', () => {
	let repo: ICompanySettingsRepo
	let service: CompanySettingsService

	beforeEach(() => {
		repo = new FakeCompanySettingsRepo() as unknown as ICompanySettingsRepo
		service = new CompanySettingsService(repo, createMockCacheClient() as never)
	})

	describe('handleGet', () => {
		test('returns the company settings when configured', async () => {
			;(repo as FakeCompanySettingsRepo).seed(makeCompanySettings({ id: 1, name: 'Test Co' }))
			const result = await service.handleGet()
			expect(result.id).toBe(1)
			expect(result.name).toBe('Test Co')
		})

		test('throws not configured when missing', async () => {
			await expectReject(service.handleGet())
		})
	})

	describe('handleDetail', () => {
		test('returns the settings when found', async () => {
			;(repo as FakeCompanySettingsRepo).seed(makeCompanySettings({ id: 1 }))
			const result = await service.handleDetail(1)
			expect(result.id).toBe(1)
		})

		test('throws NotFound when missing', async () => {
			await expectReject(service.handleDetail(404))
		})
	})

	describe('handleCreate', () => {
		test('creates company settings and returns ref', async () => {
			const actor = 7
			const dto = {
				name: 'New Company',
				currencyCode: 'IDR',
				currencySymbol: 'Rp',
			}

			const result = await service.handleCreate(dto as never, actor)
			expect(result.id).toBeDefined()
		})

		test('throws when settings already exist', async () => {
			;(repo as FakeCompanySettingsRepo).seed(makeCompanySettings({ id: 1 }))
			const dto = {
				name: 'Another',
				currencyCode: 'USD',
				currencySymbol: '$',
			}

			await expectReject(service.handleCreate(dto as never, 1))
		})
	})

	describe('handleUpdate', () => {
		test('updates existing settings and returns ref', async () => {
			;(repo as FakeCompanySettingsRepo).seed(makeCompanySettings({ id: 1, name: 'Old' }))

			const dto = {
				id: 1,
				name: 'Updated Company',
			}

			const result = await service.handleUpdate(dto as never, 9)
			expect(result.id).toBe(1)
			const stored = await repo.findById(1)
			expect(stored?.name).toBe('Updated Company')
		})

		test('throws NotFound when updating missing settings', async () => {
			const dto = {
				id: 404,
				name: 'Missing',
			}

			await expectReject(service.handleUpdate(dto as never, 1))
		})
	})
})
