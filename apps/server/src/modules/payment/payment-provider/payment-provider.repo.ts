// @ts-nocheck
import { record } from '@elysiajs/opentelemetry'
import { count, eq } from 'drizzle-orm'

import { paymentProvidersTable } from '@/db/schema'

import {
	checkConflict,
	paginate,
	searchFilter,
	sortBy,
	type ConflictField,
	type DbClient,
} from '@/infra/database'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'
import { BadRequestError, InternalServerError, NotFoundError } from '@/shared/errors/http-error'
import type { WithPaginationResult } from '@/shared/types/pagination'

import {
	PaymentProviderCreateDto,
	PaymentProviderDto,
	PaymentProviderFilterDto,
	PaymentProviderUpdateDto,
} from './payment-provider.contract'

const uniqueFields: ConflictField<any>[] = [
	{
		field: 'code',
		column: paymentProvidersTable.code,
		message: 'Payment provider code already exists',
		code: 'PAYMENT_PROVIDER_CODE_ALREADY_EXISTS',
	},
]

export class PaymentProviderRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getById(id: string): Promise<PaymentProviderDto | undefined> {
		return record('PaymentProviderRepo.getById', async () => {
			const result = await this.db
				.select()
				.from(paymentProvidersTable)
				.where(eq(paymentProvidersTable.id, id))
			if (result.length === 0) return undefined
			return PaymentProviderDto.parse(result[0])
		})
	}

	async getByCode(code: string): Promise<PaymentProviderDto | undefined> {
		return record('PaymentProviderRepo.getByCode', async () => {
			const result = await this.db
				.select()
				.from(paymentProvidersTable)
				.where(eq(paymentProvidersTable.code, code))
			if (result.length === 0) return undefined
			return PaymentProviderDto.parse(result[0])
		})
	}

	async getListPaginated(
		filter: PaymentProviderFilterDto,
	): Promise<WithPaginationResult<PaymentProviderDto>> {
		return record('PaymentProviderRepo.getListPaginated', async () => {
			const { q, page, limit } = filter
			const where = searchFilter(paymentProvidersTable.name, q)

			return paginate<any>({
				data: async ({ limit: l, offset }) => {
					const rows = await this.db
						.select()
						.from(paymentProvidersTable)
						.where(where)
						.orderBy(sortBy(paymentProvidersTable.createdAt, 'desc'))
						.limit(l)
						.offset(offset)
					return rows.map((r) => PaymentProviderDto.parse(r))
				},
				pq: { page, limit },
				countQuery: () =>
					this.db.select({ count: count() }).from(paymentProvidersTable).where(where),
			})
		})
	}

	async getAll(): Promise<PaymentProviderDto[]> {
		return record('PaymentProviderRepo.getAll', async () => {
			const rows = await this.db
				.select()
				.from(paymentProvidersTable)
				.where(eq(paymentProvidersTable.isActive, true))
				.orderBy(paymentProvidersTable.name)
			return rows.map((r) => PaymentProviderDto.parse(r))
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: PaymentProviderCreateDto, actorId: string): Promise<{ id: string }> {
		return record('PaymentProviderRepo.create', async () => {
			await checkConflict({
				table: paymentProvidersTable,
				pkColumn: paymentProvidersTable.id,
				fields: uniqueFields,
				input: { code: data.code },
			})

			const [inserted] = await this.db
				.insert(paymentProvidersTable)
				.values({ ...data, ...stampCreate(actorId) })
				.returning({ id: paymentProvidersTable.id })

			if (!inserted)
				throw new InternalServerError('Payment provider creation failed', {
					code: 'PAYMENT_PROVIDER_CREATE_FAILED',
				})

			return inserted
		})
	}

	async update(
		id: string,
		data: Partial<PaymentProviderUpdateDto>,
		actorId: string,
	): Promise<{ id: string }> {
		return record('PaymentProviderRepo.update', async () => {
			const existing = await this.getById(id)
			if (!existing)
				throw new NotFoundError(`Payment provider with ID ${id} not found`, {
					code: 'PAYMENT_PROVIDER_NOT_FOUND',
				})
			if (existing.isSystem)
				throw new BadRequestError('Cannot mutate a system payment provider', {
					code: 'PAYMENT_PROVIDER_IS_SYSTEM',
				})

			if (data.code) {
				await checkConflict({
					table: paymentProvidersTable,
					pkColumn: paymentProvidersTable.id,
					fields: uniqueFields,
					input: { code: data.code },
					existing,
				})
			}

			await this.db
				.update(paymentProvidersTable)
				.set({ ...data, ...stampUpdate(actorId) })
				.where(eq(paymentProvidersTable.id, id))

			return { id }
		})
	}

	async delete(id: string): Promise<{ id: string }> {
		return record('PaymentProviderRepo.delete', async () => {
			const existing = await this.getById(id)
			if (!existing)
				throw new NotFoundError(`Payment provider with ID ${id} not found`, {
					code: 'PAYMENT_PROVIDER_NOT_FOUND',
				})
			if (existing.isSystem)
				throw new BadRequestError('Cannot delete a system payment provider', {
					code: 'PAYMENT_PROVIDER_IS_SYSTEM',
				})

			await this.db.delete(paymentProvidersTable).where(eq(paymentProvidersTable.id, id))

			return { id }
		})
	}
}
