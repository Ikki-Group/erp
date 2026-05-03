import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, or } from 'drizzle-orm'

import {
	paginate,
	searchFilter,
	stampCreate,
	stampUpdate,
	takeFirst,
	type DbClient,
	type WithPaginationResult,
} from '@/core/database'

import { locationsTable } from '@/db/schema'

import * as dto from './location.dto'

export class LocationMasterRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getListPaginated(
		filter: dto.LocationFilterDto,
	): Promise<WithPaginationResult<dto.LocationDto>> {
		return record('LocationMasterRepo.getListPaginated', async () => {
			const { q, page, limit, type } = filter
			const where = and(
				q === undefined
					? undefined
					: or(searchFilter(locationsTable.name, q), searchFilter(locationsTable.code, q)),
				type === undefined ? undefined : eq(locationsTable.type, type),
			)

			return paginate({
				data: ({ limit, offset }) =>
					this.db
						.select()
						.from(locationsTable)
						.where(where)
						.orderBy(locationsTable.name)
						.limit(limit)
						.offset(offset),
				pq: { page, limit },
				countQuery: this.db.select({ count: count() }).from(locationsTable).where(where),
			})
		})
	}

	async getList(): Promise<dto.LocationDto[]> {
		return record('LocationMasterRepo.getList', async () => {
			return this.db.select().from(locationsTable)
		})
	}

	async getById(id: number): Promise<dto.LocationDto | undefined> {
		return record('LocationMasterRepo.getById', async () => {
			return this.db
				.select()
				.from(locationsTable)
				.where(eq(locationsTable.id, id))
				.limit(1)
				.then(takeFirst)
		})
	}

	async count(): Promise<number> {
		return record('LocationMasterRepo.count', async () => {
			return this.db
				.select({ count: count() })
				.from(locationsTable)
				.then((rows) => rows[0]?.count ?? 0)
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async create(data: dto.LocationCreateDto, actorId: number): Promise<number | undefined> {
		return record('LocationMasterRepo.create', async () => {
			const metadata = stampCreate(actorId)
			const [res] = await this.db
				.insert(locationsTable)
				.values({ ...data, ...metadata })
				.returning({ id: locationsTable.id })

			return res?.id
		})
	}

	async update(data: dto.LocationUpdateDto, actorId: number): Promise<number | undefined> {
		return record('LocationMasterRepo.update', async () => {
			const metadata = stampUpdate(actorId)
			const [res] = await this.db
				.update(locationsTable)
				.set({ ...data, ...metadata })
				.where(eq(locationsTable.id, data.id))
				.returning({ id: locationsTable.id })

			return res?.id
		})
	}

	async remove(id: number): Promise<number | undefined> {
		return record('LocationMasterRepo.remove', async () => {
			const [res] = await this.db
				.delete(locationsTable)
				.where(eq(locationsTable.id, id))
				.returning({ id: locationsTable.id })

			return res?.id
		})
	}

	async seed(data: (dto.LocationCreateDto & { createdBy: number })[]) {
		return record('LocationMasterRepo.seed', async () => {
			for (const d of data) {
				const metadata = stampCreate(d.createdBy)
				await this.db
					.insert(locationsTable)
					.values({ ...d, ...metadata })
					.onConflictDoUpdate({
						target: locationsTable.code,
						set: {
							name: d.name,
							type: d.type,
							updatedAt: metadata.updatedAt,
							updatedBy: metadata.updatedBy,
						},
					})
			}
		})
	}
}
