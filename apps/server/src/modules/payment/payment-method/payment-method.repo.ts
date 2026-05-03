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

import { paymentMethodConfigsTable } from '@/db/schema'

import * as dto from './payment-method.dto'

export class PaymentMethodConfigRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getListPaginated(
		filter: dto.PaymentMethodConfigFilterDto,
	): Promise<WithPaginationResult<dto.PaymentMethodConfigDto>> {
		return record('PaymentMethodConfigRepo.getListPaginated', async () => {
			const { q, page, limit, category, isEnabled } = filter
			const where = and(
				q === undefined ? undefined : searchFilter(paymentMethodConfigsTable.name, q),
				category === undefined ? undefined : eq(paymentMethodConfigsTable.category, category),
				isEnabled === undefined ? undefined : eq(paymentMethodConfigsTable.isEnabled, isEnabled),
			)

			const result = await paginate({
				data: ({ limit, offset }) =>
					this.db
						.select()
						.from(paymentMethodConfigsTable)
						.where(where)
						.orderBy(paymentMethodConfigsTable.name)
						.limit(limit)
						.offset(offset),
				pq: { page, limit },
				countQuery: this.db.select({ count: count() }).from(paymentMethodConfigsTable).where(where),
			})

			return {
				...result,
				data: result.data.map((item) => ({ ...item })),
			}
		})
	}

	async getList(): Promise<dto.PaymentMethodConfigDto[]> {
		return record('PaymentMethodConfigRepo.getList', async () => {
			const data = await this.db.select().from(paymentMethodConfigsTable)
			return data.map((item) => ({ ...item }))
		})
	}

	async getEnabled(): Promise<dto.PaymentMethodConfigDto[]> {
		return record('PaymentMethodConfigRepo.getEnabled', async () => {
			const data = await this.db
				.select()
				.from(paymentMethodConfigsTable)
				.where(eq(paymentMethodConfigsTable.isEnabled, true))
			return data.map((item) => ({ ...item }))
		})
	}

	async getById(id: number): Promise<dto.PaymentMethodConfigDto | undefined> {
		return record('PaymentMethodConfigRepo.getById', async () => {
			const data = await this.db
				.select()
				.from(paymentMethodConfigsTable)
				.where(eq(paymentMethodConfigsTable.id, id))
				.limit(1)
				.then(takeFirst)
			return data
		})
	}

	async count(): Promise<number> {
		return record('PaymentMethodConfigRepo.count', async () => {
			return this.db
				.select({ count: count() })
				.from(paymentMethodConfigsTable)
				.then((rows) => rows[0]?.count ?? 0)
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(
		data: dto.PaymentMethodConfigCreateDto,
		actorId: number,
	): Promise<number | undefined> {
		return record('PaymentMethodConfigRepo.create', async () => {
			const metadata = stampCreate(actorId)
			const [res] = await this.db
				.insert(paymentMethodConfigsTable)
				.values({ ...data, ...metadata })
				.returning({ id: paymentMethodConfigsTable.id })

			return res?.id
		})
	}

	async update(
		data: dto.PaymentMethodConfigUpdateDto,
		actorId: number,
	): Promise<number | undefined> {
		return record('PaymentMethodConfigRepo.update', async () => {
			const metadata = stampUpdate(actorId)
			const [res] = await this.db
				.update(paymentMethodConfigsTable)
				.set({ ...data, ...metadata })
				.where(eq(paymentMethodConfigsTable.id, data.id))
				.returning({ id: paymentMethodConfigsTable.id })

			return res?.id
		})
	}

	async remove(id: number): Promise<number | undefined> {
		return record('PaymentMethodConfigRepo.remove', async () => {
			const [res] = await this.db
				.delete(paymentMethodConfigsTable)
				.where(eq(paymentMethodConfigsTable.id, id))
				.returning({ id: paymentMethodConfigsTable.id })

			return res?.id
		})
	}

	async seed(data: (dto.PaymentMethodConfigCreateDto & { createdBy: number })[]) {
		return record('PaymentMethodConfigRepo.seed', async () => {
			for (const d of data) {
				const metadata = stampCreate(d.createdBy)
				await this.db
					.insert(paymentMethodConfigsTable)
					.values({ ...d, ...metadata })
					.onConflictDoUpdate({
						target: paymentMethodConfigsTable.name,
						set: {
							type: d.type,
							category: d.category,
							isEnabled: d.isEnabled,
							isDefault: d.isDefault,
							updatedAt: metadata.updatedAt,
							updatedBy: metadata.updatedBy,
						},
					})
			}
		})
	}
}
