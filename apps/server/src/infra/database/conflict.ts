import { eq, ne, and } from 'drizzle-orm'

import { ConflictError } from '@/shared/errors/http-error.ts'

import type { DbContext } from './index.ts'
import type { ConflictField } from './index.ts'
import type { SQL } from 'drizzle-orm'
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core'

interface CheckConflictOptions<T> {
	db: DbContext
	table: PgTable
	pkColumn: PgColumn
	fields: ConflictField<T>[]
	input: Partial<T>
	excludeId?: number
}

/**
 * Checks for conflicting records on unique fields.
 * Throws ConflictError on first duplicate found.
 */
export async function checkConflict<T>(options: CheckConflictOptions<T>): Promise<void> {
	const { db, table, pkColumn, fields, input, excludeId } = options

	for (const field of fields) {
		const value = input[field.field]
		if (value === undefined || value === null) continue

		const conditions: SQL[] = [eq(field.column, value as Parameters<typeof eq>[1])]

		if (excludeId !== undefined) {
			conditions.push(ne(pkColumn, excludeId))
		}

		const [existing] = await db
			.select({ id: pkColumn })
			.from(table)
			.where(and(...conditions))
			.limit(1)

		if (existing) {
			throw new ConflictError(field.message, { code: field.code })
		}
	}
}
