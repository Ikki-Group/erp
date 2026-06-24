import { and, count, desc, eq, or } from 'drizzle-orm'

import { customersTable, customerLoyaltyTransactionsTable } from '@/db/schema'

import {
	paginate,
	searchFilter,
	takeFirst,
	type DbClient} from '@/infra/database'
import type { WithPaginationResult } from '@/shared/types/pagination'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'

import type { ActorId, EntityRef } from '@/shared/types/utils'

import {
	CustomerDto,
	type CustomerFilterDto,
	type CustomerCreateDto,
	type CustomerUpdateDto,
	type CustomerAddPointsDto,
	type CustomerRedeemPointsDto,
	type CustomerLoyaltyTransactionDto,
} from './customer.contract'

export class CustomerRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getListPaginated(
		filter: CustomerFilterDto,
	): Promise<WithPaginationResult<CustomerDto>> {
		const { q, page, limit, tier, phone } = filter
		const where = and(
			q === undefined
				? undefined
				: or(searchFilter(customersTable.name, q), searchFilter(customersTable.code, q)),
			tier === undefined ? undefined : eq(customersTable.tier, tier),
			phone === undefined ? undefined : eq(customersTable.phone, phone),
		)

		return paginate<any>({
			data: ({ limit, offset }) =>
				this.db
					.select()
					.from(customersTable)
					.where(where)
					.orderBy(customersTable.name)
					.limit(limit)
					.offset(offset)
					.then((rows) => rows.map((r) => CustomerDto.parse(r))),
			pq: { page, limit },
			countQuery: () => this.db.select({ count: count() }).from(customersTable).where(where),
		})
	}

	async getById(id: number): Promise<CustomerDto | undefined> {
		const res = await this.db
			.select()
			.from(customersTable)
			.where(eq(customersTable.id, id))
			.limit(1)
			.then(takeFirst)

		return res ? CustomerDto.parse(res) : undefined
	}

	async getByPhone(phone: string): Promise<CustomerDto | undefined> {
		const res = await this.db
			.select()
			.from(customersTable)
			.where(eq(customersTable.phone, phone))
			.limit(1)
			.then(takeFirst)

		return res ? CustomerDto.parse(res) : undefined
	}

	async getLoyaltyHistory(customerId: number): Promise<CustomerLoyaltyTransactionDto[]> {
		return this.db
			.select()
			.from(customerLoyaltyTransactionsTable)
			.where(eq(customerLoyaltyTransactionsTable.customerId, customerId))
			.orderBy(desc(customerLoyaltyTransactionsTable.createdAt))
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: CustomerCreateDto, actorId: ActorId): Promise<EntityRef> {
		const metadata = stampCreate(actorId)
		const [res] = await this.db
			.insert(customersTable)
			.values({ ...data, ...metadata })
			.returning({ id: customersTable.id })

		return { id: res?.id ?? 0 }
	}

	async update(data: CustomerUpdateDto, actorId: ActorId): Promise<EntityRef> {
		const metadata = stampUpdate(actorId)
		const [res] = await this.db
			.update(customersTable)
			.set({ ...data, ...metadata })
			.where(eq(customersTable.id, data.id))
			.returning({ id: customersTable.id })

		return { id: res?.id ?? 0 }
	}

	async remove(id: number): Promise<EntityRef> {
		const [res] = await this.db
			.delete(customersTable)
			.where(eq(customersTable.id, id))
			.returning({ id: customersTable.id })

		return { id: res?.id ?? 0 }
	}

	async addPoints(data: CustomerAddPointsDto, actorId: ActorId): Promise<EntityRef> {
		// Get current customer
		const customer = await this.getById(data.customerId)
		if (!customer) return { id: 0 }

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

		return { id: res?.id ?? 0 }
	}

	async redeemPoints(data: CustomerRedeemPointsDto, actorId: ActorId): Promise<EntityRef> {
		// Get current customer
		const customer = await this.getById(data.customerId)
		if (!customer) return { id: 0 }

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

		return { id: res?.id ?? 0 }
	}

	async updateLastVisit(customerId: number): Promise<void> {
		await this.db
			.update(customersTable)
			.set({ lastVisitAt: new Date() })
			.where(eq(customersTable.id, customerId))
	}
}
