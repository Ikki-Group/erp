import { record } from '@elysiajs/opentelemetry'
import { and, count, eq, isNull, or } from 'drizzle-orm'

import { bento } from '@/core/cache'
import * as core from '@/core/database'
import { InternalServerError, NotFoundError } from '@/core/http/errors'
import { resolveAudit } from '@/core/utils/audit-resolver'
import type { AuditResolved } from '@/core/validation'

import { db } from '@/db'
import { locationsTable } from '@/db/schema'

import * as dto from '../dto/location.dto'

const locationCache = bento.namespace('location')

const uniqueFields: core.ConflictField<'code' | 'name'>[] = [
	{
		field: 'code',
		column: locationsTable.code,
		message: 'Location code already exists',
		code: 'LOCATION_CODE_ALREADY_EXISTS',
	},
	{
		field: 'name',
		column: locationsTable.name,
		message: 'Location name already exists',
		code: 'LOCATION_NAME_ALREADY_EXISTS',
	},
]

const err = {
	notFound: (id: number) =>
		new NotFoundError(`Location with ID ${id} not found`, 'LOCATION_NOT_FOUND'),
	createFailed: () => new InternalServerError('Location creation failed', 'LOCATION_CREATE_FAILED'),
}

// Location Service (Layer 0)
// Handles physical and virtual location management.
export class LocationService {
	// Seed initial locations into the database.
	async seed(data: (dto.LocationCreateDto & { createdBy: number })[]): Promise<void> {
		await record('LocationService.seed', async () => {
			for (const d of data) {
				const metadata = core.stampCreate(d.createdBy)
				await db
					.insert(locationsTable)
					.values({ ...d, ...metadata })
					.onConflictDoUpdate({
						target: locationsTable.code,
						targetWhere: isNull(locationsTable.deletedAt),
						set: {
							name: d.name,
							type: d.type,
							updatedAt: metadata.updatedAt,
							updatedBy: metadata.updatedBy,
							deletedAt: null,
						},
					})
			}
			await this.clearCache()
		})
	}

	// Returns active locations.
	async find(): Promise<dto.LocationDto[]> {
		const result = await record('LocationService.find', async () =>
			locationCache.getOrSet({
				key: 'list',
				factory: async () =>
					db
						.select()
						.from(locationsTable)
						.where(isNull(locationsTable.deletedAt))
						.orderBy(locationsTable.name),
			}),
		)
		return result
	}

	// Finds a location by ID.
	async getById(id: number): Promise<dto.LocationDto> {
		return record('LocationService.getById', async () => {
			return locationCache.getOrSet({
				key: `${id}`,
				factory: async () => {
					const rows = await db
						.select()
						.from(locationsTable)
						.where(and(eq(locationsTable.id, id), isNull(locationsTable.deletedAt)))

					return core.takeFirstOrThrow(
						rows,
						`Location with ID ${id} not found`,
						'LOCATION_NOT_FOUND',
					)
				},
			})
		})
	}

	// Returns total count.
	async count(): Promise<number> {
		return record('LocationService.count', async () => {
			return locationCache.getOrSet({
				key: 'count',
				factory: async () => {
					const rows = await db
						.select({ val: count() })
						.from(locationsTable)
						.where(isNull(locationsTable.deletedAt))
					return rows[0]?.val ?? 0
				},
			})
		})
	}

	// Paginated list.
	async handleList(
		filter: dto.LocationFilterDto,
	): Promise<core.WithPaginationResult<dto.LocationDto>> {
		const result = await record('LocationService.handleList', async () => {
			const { q, page, limit, type } = filter
			const where = and(
				isNull(locationsTable.deletedAt),
				q === undefined
					? undefined
					: or(
							core.searchFilter(locationsTable.name, q),
							core.searchFilter(locationsTable.code, q),
						),
				type === undefined ? undefined : eq(locationsTable.type, type),
			)

			const p = await core.paginate<dto.LocationDto>({
				data: async ({ limit: l, offset }) => {
					const rows = await db.select().from(locationsTable).where(where).limit(l).offset(offset)
					return rows.map((r) => dto.LocationDto.parse(r))
				},
				pq: { page, limit },
				countQuery: db.select({ count: count() }).from(locationsTable).where(where),
			})

			return p
		})
		return result
	}

	// Resource detail.
	async handleDetail(id: number): Promise<dto.LocationDto & AuditResolved> {
		const result = await record('LocationService.handleDetail', async () => {
			const detail = await this.getById(id)
			return resolveAudit(detail)
		})
		return result
	}

	// Creation.
	async handleCreate(data: dto.LocationCreateDto, actorId: number): Promise<{ id: number }> {
		const result = await record('LocationService.handleCreate', async () => {
			await core.checkConflict({
				table: locationsTable,
				pkColumn: locationsTable.id,
				fields: uniqueFields,
				input: data,
			})
			const [inserted] = await db
				.insert(locationsTable)
				.values({ ...data, ...core.stampCreate(actorId) })
				.returning({ id: locationsTable.id })
			if (!inserted) throw err.createFailed()
			await this.clearCache()
			return inserted
		})
		return result
	}

	// Update.
	async handleUpdate(
		{ id, ...data }: dto.LocationUpdateDto,
		actorId: number,
	): Promise<{ id: number }> {
		const result = await record('LocationService.handleUpdate', async () => {
			const existing = await this.getById(id)
			await core.checkConflict({
				table: locationsTable,
				pkColumn: locationsTable.id,
				fields: uniqueFields,
				input: data,
				existing,
			})
			await db
				.update(locationsTable)
				.set({ ...data, ...core.stampUpdate(actorId) })
				.where(eq(locationsTable.id, id))
			await this.clearCache(id)
			return { id }
		})
		return result
	}

	// Soft Remove.
	async handleRemove(id: number, actorId: number): Promise<{ id: number }> {
		return record('LocationService.handleRemove', async () => {
			const [result] = await db
				.update(locationsTable)
				.set({ deletedAt: new Date(), deletedBy: actorId })
				.where(eq(locationsTable.id, id))
				.returning({ id: locationsTable.id })
			if (!result) throw err.notFound(id)
			await this.clearCache(id)
			return result
		})
	}

	// Hard Remove.
	async handleHardRemove(id: number): Promise<{ id: number }> {
		return record('LocationService.handleHardRemove', async () => {
			const [result] = await db
				.delete(locationsTable)
				.where(eq(locationsTable.id, id))
				.returning({ id: locationsTable.id })
			if (!result) throw err.notFound(id)
			await this.clearCache(id)
			return result
		})
	}

	// Clear relevant caches.
	private async clearCache(id?: number) {
		const keys = ['list', 'count']
		if (id) keys.push(`${id}`)
		await locationCache.deleteMany({ keys })
	}
}
