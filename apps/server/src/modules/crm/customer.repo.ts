import { and, count, desc, eq, or, SQL } from 'drizzle-orm'

import { customersTable, customerLoyaltyTransactionsTable } from '@/db/schema'

import { paginate, searchFilter, takeFirst, type DbContext } from '@/infra/database'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { ActorId, EntityRef } from '@/shared/types/utils'

import type {
	CustomerDto,
	CustomerFilterDto,
	CustomerCreateDto,
	CustomerUpdateDto,
	CustomerAddPointsDto,
	CustomerRedeemPointsDto,
	CustomerLoyaltyTransactionDto,
} from './customer.contract'

export interface ICustomerRepo {
	readonly db: DbContext
	findMany(filter?: Partial<CustomerFilterDto>, db?: DbContext): Promise<CustomerDto[]>
	findPage(filter: CustomerFilterDto, db?: DbContext): Promise<WithPaginationResult<CustomerDto>>
	findById(id: number, db?: DbContext): Promise<CustomerDto | undefined>
	findByPhone(phone: string, db?: DbContext): Promise<CustomerDto | undefined>
	findLoyaltyHistory(customerId: number, db?: DbContext): Promise<CustomerLoyaltyTransactionDto[]>
	insert(data: CustomerCreateDto, actorId: ActorId, db?: DbContext): Promise<EntityRef | undefined>
	update(
		id: number,
		data: CustomerUpdateDto,
		actorId: ActorId,
		db?: DbContext,
	): Promise<EntityRef | undefined>
	remove(id: number, db?: DbContext): Promise<EntityRef | undefined>
	addPoints(
		data: CustomerAddPointsDto,
		actorId: ActorId,
		db?: DbContext,
	): Promise<EntityRef | undefined>
	redeemPoints(
		data: CustomerRedeemPointsDto,
		actorId: ActorId,
		db?: DbContext,
	): Promise<EntityRef | undefined>
	updateLastVisit(customerId: number, db?: DbContext): Promise<void>
}

export class CustomerRepo implements ICustomerRepo {
	constructor(readonly db: DbContext) {}

	#buildWhere(filter: Partial<Pick<CustomerFilterDto, 'q' | 'tier' | 'phone'>>): SQL | undefined {
		const { q, tier, phone } = filter
		return and(
			q === undefined
				? undefined
				: or(searchFilter(customersTable.name, q), searchFilter(customersTable.code, q)),
			tier === undefined ? undefined : eq(customersTable.tier, tier),
			phone === undefined ? undefined : eq(customersTable.phone, phone),
		)
	}

	async findMany(
		filter: Partial<Pick<CustomerFilterDto, 'q' | 'tier' | 'phone'>> = {},
		db: DbContext = this.db,
	): Promise<CustomerDto[]> {
		const where = this.#buildWhere(filter)
		const rows = await db.select().from(customersTable).where(where)
		return rows.map((r) => ({ ...r, tier: r.tier ?? 'bronze' })) as CustomerDto[]
	}

	async findPage(
		filter: CustomerFilterDto,
		db: DbContext = this.db,
	): Promise<WithPaginationResult<CustomerDto>> {
		const where = this.#buildWhere(filter)

		return paginate<CustomerDto>({
			data: async ({ limit, offset }) => {
				const rows = await db
					.select()
					.from(customersTable)
					.where(where)
					.orderBy(customersTable.name)
					.limit(limit)
					.offset(offset)
				return rows.map((r) => ({ ...r, tier: r.tier ?? 'bronze' })) as CustomerDto[]
			},
			pq: filter,
			countQuery: () => db.select({ count: count() }).from(customersTable).where(where),
		})
	}

	async findById(id: number, db: DbContext = this.db): Promise<CustomerDto | undefined> {
		const row = await db
			.select()
			.from(customersTable)
			.where(eq(customersTable.id, id))
			.limit(1)
			.then(takeFirst)

		return row ? ({ ...row, tier: row.tier ?? 'bronze' } as CustomerDto) : undefined
	}

	async findByPhone(phone: string, db: DbContext = this.db): Promise<CustomerDto | undefined> {
		const row = await db
			.select()
			.from(customersTable)
			.where(eq(customersTable.phone, phone))
			.limit(1)
			.then(takeFirst)

		return row ? ({ ...row, tier: row.tier ?? 'bronze' } as CustomerDto) : undefined
	}

	async findLoyaltyHistory(
		customerId: number,
		db: DbContext = this.db,
	): Promise<CustomerLoyaltyTransactionDto[]> {
		return db
			.select()
			.from(customerLoyaltyTransactionsTable)
			.where(eq(customerLoyaltyTransactionsTable.customerId, customerId))
			.orderBy(desc(customerLoyaltyTransactionsTable.createdAt))
	}

	async insert(
		data: CustomerCreateDto,
		actorId: ActorId,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [res] = await db
			.insert(customersTable)
			.values({
				...data,
				tier: 'bronze',
				pointsBalance: 0,
				totalPointsEarned: 0,
				registeredAt: new Date(),
				...stampCreate(actorId),
			})
			.returning({ id: customersTable.id })

		return res
	}

	async update(
		id: number,
		data: CustomerUpdateDto,
		actorId: ActorId,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const { id: _, ...updateData } = data
		const [res] = await db
			.update(customersTable)
			.set({
				...updateData,
				...stampUpdate(actorId),
			})
			.where(eq(customersTable.id, id))
			.returning({ id: customersTable.id })

		return res
	}

	async remove(id: number, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db
			.delete(customersTable)
			.where(eq(customersTable.id, id))
			.returning({ id: customersTable.id })

		return res
	}

	async addPoints(
		data: CustomerAddPointsDto,
		actorId: ActorId,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const customer = await this.findById(data.customerId, db)
		if (!customer) return undefined

		const newBalance = customer.pointsBalance + data.points
		const totalEarned = customer.totalPointsEarned + data.points

		await db
			.update(customersTable)
			.set({
				pointsBalance: newBalance,
				totalPointsEarned: totalEarned,
				...stampUpdate(actorId),
			})
			.where(eq(customersTable.id, data.customerId))

		const [res] = await db
			.insert(customerLoyaltyTransactionsTable)
			.values({
				customerId: data.customerId,
				type: 'earned',
				points: data.points,
				balanceAfter: newBalance,
				referenceType: data.referenceType ?? null,
				referenceId: data.referenceId ?? null,
				description: data.description,
				...stampCreate(actorId),
			})
			.returning({ id: customerLoyaltyTransactionsTable.id })

		return res
	}

	async redeemPoints(
		data: CustomerRedeemPointsDto,
		actorId: ActorId,
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const customer = await this.findById(data.customerId, db)
		if (!customer) return undefined

		if (customer.pointsBalance < data.points) {
			throw new Error('Insufficient points balance')
		}

		const newBalance = customer.pointsBalance - data.points

		await db
			.update(customersTable)
			.set({
				pointsBalance: newBalance,
				...stampUpdate(actorId),
			})
			.where(eq(customersTable.id, data.customerId))

		const [res] = await db
			.insert(customerLoyaltyTransactionsTable)
			.values({
				customerId: data.customerId,
				type: 'redeemed',
				points: -data.points,
				balanceAfter: newBalance,
				referenceType: data.referenceType ?? null,
				referenceId: data.referenceId ?? null,
				description: data.description,
				...stampCreate(actorId),
			})
			.returning({ id: customerLoyaltyTransactionsTable.id })

		return res
	}

	async updateLastVisit(customerId: number, db: DbContext = this.db): Promise<void> {
		await db
			.update(customersTable)
			.set({ lastVisitAt: new Date() })
			.where(eq(customersTable.id, customerId))
	}
}
