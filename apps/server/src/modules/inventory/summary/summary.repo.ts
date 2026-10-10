import { locations } from '@/db/schema/core.ts'

import { and, eq, inArray, sql } from '@/infra/database/index.ts'
import type { Db, DbContext } from '@/infra/database/index.ts'

import type { InventoryLocationSummaryDto } from '@ikki/contract/inventory/summary'
import type { SQL } from 'drizzle-orm'

/** Correlated scalar count subquery against the outer `locations` row. */
const count = (subquery: SQL) => sql<number>`(${subquery})`.mapWith(Number)

// ─── Implementation ───

export class SummaryRepo {
	constructor(readonly db: DbContext) {}

	/**
	 * One statement: correlated count subqueries per location row (raw SQL so the
	 * outer `locations.id` reference stays qualified).
	 * `locationIds === null` means every active location.
	 */
	async findByLocations(
		locationIds: number[] | null,
		db: Db = this.db,
	): Promise<InventoryLocationSummaryDto[]> {
		if (locationIds?.length === 0) return []
		const rows = await db
			.select({
				id: locations.id,
				code: locations.code,
				name: locations.name,
				type: locations.type,
				lowStockCount: count(sql`
					select count(*) from stock_balances sb
					join materials m on m.id = sb.material_id
					where sb.location_id = locations.id
						and m.is_active and m.min_stock is not null and sb.quantity < m.min_stock`),
				negativeStockCount: count(sql`
					select count(*) from stock_balances sb
					where sb.location_id = locations.id and sb.quantity < 0`),
				transfersInTransit: count(sql`
					select count(*) from transfer_requests t
					where t.status = 'in_transit'
						and (t.from_location_id = locations.id or t.to_location_id = locations.id)`),
				activeOpname: count(sql`
					select count(*) from stock_opnames o
					where o.location_id = locations.id and o.status in ('draft', 'in_progress')`),
				draftReceivings: count(sql`
					select count(*) from receivings r
					where r.location_id = locations.id and r.status = 'draft'`),
			})
			.from(locations)
			.where(
				and(
					eq(locations.isActive, true),
					locationIds === null ? undefined : inArray(locations.id, locationIds),
				),
			)
			.orderBy(locations.code)
		return rows
	}
}
