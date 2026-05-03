import { record } from '@elysiajs/opentelemetry'
import { and, count, desc, eq, or } from 'drizzle-orm'

import {
	paginate,
	searchFilter,
	stampCreate,
	stampUpdate,
	takeFirst,
	type DbClient,
	type WithPaginationResult,
} from '@/core/database'

import { customersTable, customerLoyaltyTransactionsTable } from '@/db/schema'

import * as dto from './customer.dto'

export class CustomerRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getListPaginated(
		filter: dto.CustomerFilterDto,
	): Promise<WithPaginationResult<dto.CustomerDto>> {
		return record('CustomerRepo.getListPaginated', async () => {
			const { q, page, limit, tier, phone } = filter
			const where = and(
				q === undefined
					? undefined
					: or(searchFilter(customersTable.name, q), searchFilter(customersTable.code, q)),
				tier === undefined ? undefined : eq(customersTable.tier, tier),
				phone === undefined ? undefined : eq(customersTable.phone, phone),
			)

			return paginate({
				data: ({ limit, offset }) =>
					this.db
						.select()
						.from(customersTable)
						.where(where)
						.orderBy(customersTable.name)
						.limit(limit)
						.offset(offset)
						.then((rows) => rows.map((r) => dto.CustomerDto.parse(r))),
				pq: { page, limit },
				countQuery: this.db.select({ count: count() }).from(customersTable).where(where),
			})
		})
	}

	async getById(id: number): Promise<dto.CustomerDto | undefined> {
		return record('CustomerRepo.getById', async () => {
			const res = await this.db
				.select()
				.from(customersTable)
				.where(eq(customersTable.id, id))
				.limit(1)
				.then(takeFirst)

			return res ? dto.CustomerDto.parse(res) : undefined
		})
	}

	async getByPhone(phone: string): Promise<dto.CustomerDto | undefined> {
		return record('CustomerRepo.getByPhone', async () => {
			const res = await this.db
				.select()
				.from(customersTable)
				.where(eq(customersTable.phone, phone))
				.limit(1)
				.then(takeFirst)

			return res ? dto.CustomerDto.parse(res) : undefined
		})
	}

	async getLoyaltyHistory(customerId: number): Promise<dto.CustomerLoyaltyTransactionDto[]> {
		return record('CustomerRepo.getLoyaltyHistory', async () => {
			return this.db
				.select()
				.from(customerLoyaltyTransactionsTable)
				.where(eq(customerLoyaltyTransactionsTable.customerId, customerId))
				.orderBy(desc(customerLoyaltyTransactionsTable.createdAt))
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: dto.CustomerCreateDto, actorId: number): Promise<number | undefined> {
		return record('CustomerRepo.create', async () => {
			const metadata = stampCreate(actorId)
			const [res] = await this.db
				.insert(customersTable)
				.values({ ...data, ...metadata })
				.returning({ id: customersTable.id })

			return res?.id
		})
	}

	async update(data: dto.CustomerUpdateDto, actorId: number): Promise<number | undefined> {
		return record('CustomerRepo.update', async () => {
			const metadata = stampUpdate(actorId)
			const [res] = await this.db
				.update(customersTable)
				.set({ ...data, ...metadata })
				.where(eq(customersTable.id, data.id))
				.returning({ id: customersTable.id })

			return res?.id
		})
	}

	async remove(id: number): Promise<number | undefined> {
		return record('CustomerRepo.remove', async () => {
			const [res] = await this.db
				.delete(customersTable)
				.where(eq(customersTable.id, id))
				.returning({ id: customersTable.id })

			return res?.id
		})
	}

	async addPoints(data: dto.CustomerAddPointsDto, actorId: number): Promise<number | undefined> {
		return record('CustomerRepo.addPoints', async () => {
			// Get current customer
			const customer = await this.getById(data.customerId)
			if (!customer) return undefined

			// Calculate new balance
			const newBalance = customer.pointsBalance + data.points
			const totalEarned = customer.totalPointsEarned + data.points

			// Update customer
			await this.db
				.update(customersTable)
				.set({
					pointsBalance: newBalance,
					totalPointsEarned: totalEarned,
					updatedAt: new Date(),
					updatedBy: actorId,
				})
				.where(eq(customersTable.id, data.customerId))

			// Create loyalty transaction record
			const metadata = stampCreate(actorId)
			const [res] = await this.db
				.insert(customerLoyaltyTransactionsTable)
				.values({
					customerId: data.customerId,
					type: 'earned',
					points: data.points,
					balanceAfter: newBalance,
					referenceType: data.referenceType,
					referenceId: data.referenceId,
					description: data.description,
					...metadata,
				})
				.returning({ id: customerLoyaltyTransactionsTable.id })

			return res?.id
		})
	}

	async redeemPoints(
		data: dto.CustomerRedeemPointsDto,
		actorId: number,
	): Promise<number | undefined> {
		return record('CustomerRepo.redeemPoints', async () => {
			// Get current customer
			const customer = await this.getById(data.customerId)
			if (!customer) return undefined

			// Check if customer has enough points
			if (customer.pointsBalance < data.points) {
				throw new Error('Insufficient points balance')
			}

			// Calculate new balance
			const newBalance = customer.pointsBalance - data.points

			// Update customer
			await this.db
				.update(customersTable)
				.set({
					pointsBalance: newBalance,
					updatedAt: new Date(),
					updatedBy: actorId,
				})
				.where(eq(customersTable.id, data.customerId))

			// Create loyalty transaction record
			const metadata = stampCreate(actorId)
			const [res] = await this.db
				.insert(customerLoyaltyTransactionsTable)
				.values({
					customerId: data.customerId,
					type: 'redeemed',
					points: -data.points,
					balanceAfter: newBalance,
					referenceType: data.referenceType,
					referenceId: data.referenceId,
					description: data.description,
					...metadata,
				})
				.returning({ id: customerLoyaltyTransactionsTable.id })

			return res?.id
		})
	}

	async updateLastVisit(customerId: number): Promise<void> {
		return record('CustomerRepo.updateLastVisit', async () => {
			await this.db
				.update(customersTable)
				.set({ lastVisitAt: new Date() })
				.where(eq(customersTable.id, customerId))
		})
	}
}
