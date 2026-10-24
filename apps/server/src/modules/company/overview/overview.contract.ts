import { z } from 'zod'

const Count = z.number().int()

const OverviewLocationsDto = z.object({
	total: Count,
	stores: Count,
	warehouses: Count,
	inactive: Count,
})

const OverviewPeopleDto = z.object({
	activeUsers: Count,
	inactiveUsers: Count,
	/** Active users with no assignment at all. */
	usersWithoutAccess: Count,
	roles: Count,
})

const OverviewSiteDto = z.object({
	id: z.number().int(),
	code: z.string(),
	name: z.string(),
	type: z.enum(['store', 'warehouse']),
	isActive: z.boolean(),
	/** Distinct active users assigned AT this location (global assignments excluded). */
	staff: Count,
	/** Transfers in transit that leave from or arrive at this location. */
	transfersInTransit: Count,
	draftReceivings: Count,
	openOpnames: Count,
	/** Balances below the material's min stock. */
	lowStock: Count,
	openShifts: Count,
	/** Completed orders within the business day; revenue is a decimal string. */
	salesToday: z.object({ orders: Count, revenue: z.string() }),
})

export const CompanyOverviewDto = z.object({
	locations: OverviewLocationsDto,
	/** Null unless the caller holds a global `iam.read` grant. */
	people: OverviewPeopleDto.nullable(),
	/** Business day (server time zone) as `YYYY-MM-DD`. */
	businessDate: z.string(),
	sites: z.array(OverviewSiteDto),
})
export type CompanyOverviewDto = z.infer<typeof CompanyOverviewDto>

export type OverviewSiteDto = z.infer<typeof OverviewSiteDto>
export type OverviewPeopleDto = z.infer<typeof OverviewPeopleDto>
