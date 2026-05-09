import { record } from '@elysiajs/opentelemetry'
import { and, count, eq } from 'drizzle-orm'

import {
	paginate,
	searchFilter,
	stampCreate,
	stampUpdate,
	takeFirst,
	type DbClient,
	type WithPaginationResult,
} from '@/core/database'

import { paymentMethodsTable } from '@/db/schema'

import * as dto from './payment-method.dto'

export class PaymentMethodRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getListPaginated(
		filter: dto.PaymentMethodFilterDto,
	): Promise<WithPaginationResult<dto.PaymentMethodDto>> {
		return record('PaymentMethodRepo.getListPaginated', async () => {
			const { q, page, limit, category, isEnabled, isGlobal } = filter
			const where = and(
				q === undefined ? undefined : searchFilter(paymentMethodsTable.name, q),
				category === undefined ? undefined : eq(paymentMethodsTable.category, category),
				isEnabled === undefined ? undefined : eq(paymentMethodsTable.isEnabled, isEnabled),
				isGlobal === undefined ? undefined : eq(paymentMethodsTable.isGlobal, isGlobal),
			)

			const result = await paginate({
				data: ({ limit, offset }) =>
					this.db
						.select()
						.from(paymentMethodsTable)
						.where(where)
						.orderBy(paymentMethodsTable.name)
						.limit(limit)
						.offset(offset),
				pq: { page, limit },
				countQuery: this.db.select({ count: count() }).from(paymentMethodsTable).where(where),
			})

			return {
				...result,
				data: result.data.map((item) => ({ ...item })),
			}
		})
	}

	async getList(): Promise<dto.PaymentMethodDto[]> {
		return record('PaymentMethodRepo.getList', async () => {
			const data = await this.db.select().from(paymentMethodsTable)
			return data.map((item) => ({ ...item }))
		})
	}

	async getEnabled(): Promise<dto.PaymentMethodDto[]> {
		return record('PaymentMethodRepo.getEnabled', async () => {
			const data = await this.db
				.select()
				.from(paymentMethodsTable)
				.where(eq(paymentMethodsTable.isEnabled, true))
			return data.map((item) => ({ ...item }))
		})
	}

	async getGlobal(): Promise<dto.PaymentMethodDto[]> {
		return record('PaymentMethodRepo.getGlobal', async () => {
			const data = await this.db
				.select()
				.from(paymentMethodsTable)
				.where(and(eq(paymentMethodsTable.isEnabled, true), eq(paymentMethodsTable.isGlobal, true)))
			return data.map((item) => ({ ...item }))
		})
	}

	async getById(id: number): Promise<dto.PaymentMethodDto | undefined> {
		return record('PaymentMethodRepo.getById', async () => {
			const data = await this.db
				.select()
				.from(paymentMethodsTable)
				.where(eq(paymentMethodsTable.id, id))
				.limit(1)
				.then(takeFirst)
			return data
		})
	}

	async count(): Promise<number> {
		return record('PaymentMethodRepo.count', async () => {
			return this.db
				.select({ count: count() })
				.from(paymentMethodsTable)
				.then((rows) => rows[0]?.count ?? 0)
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: dto.PaymentMethodCreateDto, actorId: number): Promise<number | undefined> {
		return record('PaymentMethodRepo.create', async () => {
			const metadata = stampCreate(actorId)
			const [res] = await this.db
				.insert(paymentMethodsTable)
				.values({ ...data, ...metadata })
				.returning({ id: paymentMethodsTable.id })

			return res?.id
		})
	}

	async update(data: dto.PaymentMethodUpdateDto, actorId: number): Promise<number | undefined> {
		return record('PaymentMethodRepo.update', async () => {
			const metadata = stampUpdate(actorId)
			const [res] = await this.db
				.update(paymentMethodsTable)
				.set({ ...data, ...metadata })
				.where(eq(paymentMethodsTable.id, data.id))
				.returning({ id: paymentMethodsTable.id })

			return res?.id
		})
	}

	async remove(id: number): Promise<number | undefined> {
		return record('PaymentMethodRepo.remove', async () => {
			const [res] = await this.db
				.delete(paymentMethodsTable)
				.where(eq(paymentMethodsTable.id, id))
				.returning({ id: paymentMethodsTable.id })

			return res?.id
		})
	}

	async seed(data: (dto.PaymentMethodCreateDto & { createdBy: number })[]) {
		return record('PaymentMethodRepo.seed', async () => {
			for (const d of data) {
				const metadata = stampCreate(d.createdBy)
				await this.db
					.insert(paymentMethodsTable)
					.values({ ...d, ...metadata })
					.onConflictDoUpdate({
						target: paymentMethodsTable.name,
						set: {
							type: d.type,
							category: d.category,
							isEnabled: d.isEnabled,
							isDefault: d.isDefault,
							isGlobal: d.isGlobal,
							updatedAt: metadata.updatedAt,
							updatedBy: metadata.updatedBy,
						},
					})
			}
		})
	}
}
