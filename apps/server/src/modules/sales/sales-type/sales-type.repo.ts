import { record } from '@elysiajs/opentelemetry'
import { count, eq } from 'drizzle-orm'

import {
	checkConflict,
	paginate,
	searchFilter,
	sortBy,
	stampCreate,
	stampUpdate,
	type ConflictField,
	type DbClient,
	type WithPaginationResult,
} from '@/core/database'
import { BadRequestError, InternalServerError, NotFoundError } from '@/core/http/errors'

import { salesTypesTable } from '@/db/schema'

import {
	SalesTypeCreateDto,
	SalesTypeDto,
	SalesTypeFilterDto,
	SalesTypeUpdateDto,
} from './sales-type.dto'

const uniqueFields: ConflictField<'code'>[] = [
	{
		field: 'code',
		column: salesTypesTable.code,
		message: 'Sales type code already exists',
		code: 'SALES_TYPE_CODE_ALREADY_EXISTS',
	},
]

export class SalesTypeRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async getById(id: number): Promise<SalesTypeDto | undefined> {
		return record('SalesTypeRepo.getById', async () => {
			const result = await this.db.select().from(salesTypesTable).where(eq(salesTypesTable.id, id))
			if (result.length === 0) return undefined
			return SalesTypeDto.parse(result[0])
		})
	}

	async getListPaginated(filter: SalesTypeFilterDto): Promise<WithPaginationResult<SalesTypeDto>> {
		return record('SalesTypeRepo.getListPaginated', async () => {
			const { q, page, limit } = filter
			const where = searchFilter(salesTypesTable.name, q)

			return paginate({
				data: async ({ limit: l, offset }) => {
					const rows = await this.db
						.select()
						.from(salesTypesTable)
						.where(where)
						.orderBy(sortBy(salesTypesTable.updatedAt, 'desc'))
						.limit(l)
						.offset(offset)
					return rows.map((r) => SalesTypeDto.parse(r))
				},
				pq: { page, limit },
				countQuery: this.db.select({ count: count() }).from(salesTypesTable).where(where),
			})
		})
	}

	async getAll(): Promise<SalesTypeDto[]> {
		return record('SalesTypeRepo.getAll', async () => {
			const rows = await this.db.select().from(salesTypesTable).orderBy(salesTypesTable.name)
			return rows.map((r) => SalesTypeDto.parse(r))
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async seed(data: (SalesTypeCreateDto & { id?: number; createdBy: number })[]): Promise<void> {
		return record('SalesTypeRepo.seed', async () => {
			for (const d of data) {
				const metadata = stampCreate(d.createdBy)
				await this.db
					.insert(salesTypesTable)
					.values({ ...d, ...metadata })
					.onConflictDoUpdate({
						target: salesTypesTable.code,
						set: {
							name: d.name,
							isSystem: d.isSystem,
							updatedAt: metadata.updatedAt,
							updatedBy: metadata.updatedBy,
						},
					})
			}
		})
	}

	async create(data: SalesTypeCreateDto, actorId: number): Promise<{ id: number }> {
		return record('SalesTypeRepo.create', async () => {
			const code = data.code.trim().toLowerCase()
			const name = data.name.trim()

			await checkConflict({
				table: salesTypesTable,
				pkColumn: salesTypesTable.id,
				fields: uniqueFields,
				input: { code },
			})

			const [inserted] = await this.db
				.insert(salesTypesTable)
				.values({ ...data, code, name, isSystem: false, ...stampCreate(actorId) })
				.returning({ id: salesTypesTable.id })

			if (!inserted)
				throw new InternalServerError('Sales type creation failed', 'SALES_TYPE_CREATE_FAILED')

			return inserted
		})
	}

	async update(
		id: number,
		data: Partial<SalesTypeUpdateDto>,
		actorId: number,
	): Promise<{ id: number }> {
		return record('SalesTypeRepo.update', async () => {
			const existing = await this.getById(id)
			if (!existing)
				throw new NotFoundError(`Sales type with ID ${id} not found`, 'SALES_TYPE_NOT_FOUND')
			if (existing.isSystem)
				throw new BadRequestError('Cannot mutate a system sales type', 'SALES_TYPE_IS_SYSTEM')

			const code = data.code ? data.code.trim().toLowerCase() : existing.code
			const name = data.name ? data.name.trim() : existing.name

			await checkConflict({
				table: salesTypesTable,
				pkColumn: salesTypesTable.id,
				fields: uniqueFields,
				input: { code },
				existing,
			})

			await this.db
				.update(salesTypesTable)
				.set({ ...data, code, name, isSystem: false, ...stampUpdate(actorId) })
				.where(eq(salesTypesTable.id, id))

			return { id }
		})
	}

	async delete(id: number): Promise<{ id: number }> {
		return record('SalesTypeRepo.delete', async () => {
			const existing = await this.getById(id)
			if (!existing)
				throw new NotFoundError(`Sales type with ID ${id} not found`, 'SALES_TYPE_NOT_FOUND')

			await this.db.delete(salesTypesTable).where(eq(salesTypesTable.id, id))

			return { id }
		})
	}
}
