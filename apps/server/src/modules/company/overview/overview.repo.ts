import { locations } from '@/db/schema/core.ts'
import { roles, userAssignments, users } from '@/db/schema/iam.ts'
import { receivings, stockBalances, stockOpnames, transferRequests } from '@/db/schema/inventory.ts'
import { materials } from '@/db/schema/material.ts'
import { cashierShifts, orders } from '@/db/schema/pos.ts'

import { allOf, eq, inScope, sql } from '@/infra/database/index.ts'
import type { DbContext, LocationScope } from '@/infra/database/index.ts'

import type { OverviewPeopleDto, OverviewSiteDto } from './overview.contract.ts'

// ─── Types ───

type SiteBase = Pick<OverviewSiteDto, 'id' | 'code' | 'name' | 'type' | 'isActive'>

interface OverviewSiteMetrics {
	staff: Map<number, number>
	transfersInTransit: Map<number, number>
	draftReceivings: Map<number, number>
	openOpnames: Map<number, number>
	lowStock: Map<number, number>
	openShifts: Map<number, number>
	sales: Map<number, { orders: number; revenue: string }>
}

export interface IOverviewRepo {
	/** Business date (`YYYY-MM-DD`) of "now" in the configured time zone. */
	businessDate(): Promise<string>
	findSites(scope: LocationScope): Promise<SiteBase[]>
	findPeople(): Promise<OverviewPeopleDto>
	/** Per-location aggregates for the given sites, one grouped query per metric. */
	findSiteMetrics(siteIds: number[]): Promise<OverviewSiteMetrics>
}

// ─── Implementation ───

const count = sql<number>`count(*)::int`

function toMap<V>(rows: { locationId: number; value: V }[]): Map<number, V> {
	return new Map(rows.map((r) => [r.locationId, r.value]))
}

/**
 * `timeZone` is an IANA name. The business day is computed in SQL:
 * `date_trunc('day', now() AT TIME ZONE tz) AT TIME ZONE tz` is the instant the
 * current local day started, so DST/offset rules come from Postgres.
 */
export function createOverviewRepo(db: DbContext, timeZone: string): IOverviewRepo {
	const startOfToday = sql`(date_trunc('day', now() AT TIME ZONE ${timeZone}) AT TIME ZONE ${timeZone})`

	return {
		async businessDate() {
			const [row] = await db
				.select({ date: sql<string>`to_char(now() AT TIME ZONE ${timeZone}, 'YYYY-MM-DD')` })
				.from(sql`(select 1) as t`)
			return row?.date ?? ''
		},

		findSites(scope) {
			return db
				.select({
					id: locations.id,
					code: locations.code,
					name: locations.name,
					type: locations.type,
					isActive: locations.isActive,
				})
				.from(locations)
				.where(inScope(scope, locations.id))
				.orderBy(locations.type, locations.name, locations.id)
		},

		async findPeople() {
			// Joined so Drizzle qualifies every column; a NOT EXISTS written as raw SQL renders
			// `"id"` unqualified and binds it to the subquery's own table.
			const [userRow] = await db
				.select({
					active: sql<number>`count(distinct ${users.id}) filter (where ${users.isActive})::int`,
					inactive: sql<number>`count(distinct ${users.id}) filter (where not ${users.isActive})::int`,
					withoutAccess: sql<number>`count(distinct ${users.id}) filter (where ${users.isActive} and ${userAssignments.id} is null)::int`,
				})
				.from(users)
				.leftJoin(userAssignments, eq(userAssignments.userId, users.id))
			const [roleRow] = await db.select({ total: count }).from(roles)
			return {
				activeUsers: userRow?.active ?? 0,
				inactiveUsers: userRow?.inactive ?? 0,
				usersWithoutAccess: userRow?.withoutAccess ?? 0,
				roles: roleRow?.total ?? 0,
			}
		},

		async findSiteMetrics(siteIds) {
			const [staff, transfersFrom, transfersTo, receiving, opnames, lowStock, shifts, sales] =
				await Promise.all([
					db
						.select({
							locationId: userAssignments.locationId,
							value: sql<number>`count(distinct ${users.id})::int`,
						})
						.from(userAssignments)
						.innerJoin(users, eq(users.id, userAssignments.userId))
						.where(allOf(eq(users.isActive, true), inScope(siteIds, userAssignments.locationId)))
						.groupBy(userAssignments.locationId),
					db
						.select({ locationId: transferRequests.fromLocationId, value: count })
						.from(transferRequests)
						.where(
							allOf(
								eq(transferRequests.status, 'in_transit'),
								inScope(siteIds, transferRequests.fromLocationId),
							),
						)
						.groupBy(transferRequests.fromLocationId),
					db
						.select({ locationId: transferRequests.toLocationId, value: count })
						.from(transferRequests)
						.where(
							allOf(
								eq(transferRequests.status, 'in_transit'),
								inScope(siteIds, transferRequests.toLocationId),
							),
						)
						.groupBy(transferRequests.toLocationId),
					db
						.select({ locationId: receivings.locationId, value: count })
						.from(receivings)
						.where(allOf(eq(receivings.status, 'draft'), inScope(siteIds, receivings.locationId)))
						.groupBy(receivings.locationId),
					db
						.select({ locationId: stockOpnames.locationId, value: count })
						.from(stockOpnames)
						.where(
							allOf(eq(stockOpnames.status, 'draft'), inScope(siteIds, stockOpnames.locationId)),
						)
						.groupBy(stockOpnames.locationId),
					db
						.select({ locationId: stockBalances.locationId, value: count })
						.from(stockBalances)
						.innerJoin(materials, eq(materials.id, stockBalances.materialId))
						.where(
							allOf(
								sql`${materials.minStock} is not null and ${stockBalances.quantity} < ${materials.minStock}`,
								inScope(siteIds, stockBalances.locationId),
							),
						)
						.groupBy(stockBalances.locationId),
					db
						.select({ locationId: cashierShifts.locationId, value: count })
						.from(cashierShifts)
						.where(
							allOf(eq(cashierShifts.status, 'open'), inScope(siteIds, cashierShifts.locationId)),
						)
						.groupBy(cashierShifts.locationId),
					db
						.select({
							locationId: orders.locationId,
							orders: count,
							revenue: sql<string>`coalesce(sum(${orders.total}), 0)::numeric(18,2)::text`,
						})
						.from(orders)
						.where(
							allOf(
								eq(orders.status, 'completed'),
								sql`${orders.completedAt} >= ${startOfToday}`,
								inScope(siteIds, orders.locationId),
							),
						)
						.groupBy(orders.locationId),
				])

			const transfersInTransit = toMap(transfersFrom)
			for (const row of transfersTo) {
				transfersInTransit.set(
					row.locationId,
					(transfersInTransit.get(row.locationId) ?? 0) + row.value,
				)
			}

			return {
				// Assignments with a null location are global; inScope already excludes them,
				// the filter below only narrows the type.
				staff: toMap(
					staff.flatMap((r) =>
						r.locationId === null ? [] : [{ locationId: r.locationId, value: r.value }],
					),
				),
				transfersInTransit,
				draftReceivings: toMap(receiving),
				openOpnames: toMap(opnames),
				lowStock: toMap(lowStock),
				openShifts: toMap(shifts),
				sales: new Map(
					sales.map((r) => [r.locationId, { orders: r.orders, revenue: r.revenue }] as const),
				),
			}
		},
	}
}
