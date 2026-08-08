import { neon } from '@neondatabase/serverless'
import { sql, eq, and, or, ilike, inArray, asc, desc } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/neon-http'

import { env } from '@/shared/config/env.ts'
import type { PaginationQuery, WithPaginationResult } from '@/shared/types/pagination.ts'

import type { SQL } from 'drizzle-orm'
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core'

// ─── DB Client ───

const queryClient = neon(env.DATABASE_URL)
export const db = drizzle({ client: queryClient })

export type DbContext = typeof db

// ─── Query Helpers ───

export function takeFirst<T>(rows: T[]): T | undefined {
	return rows[0]
}

export function toLimitOffset(pq: PaginationQuery) {
	return {
		limit: pq.limit,
		offset: (pq.page - 1) * pq.limit,
	}
}

export function paginateWindow<T extends { rowCount: number }>(
	rows: T[],
	pq: PaginationQuery,
): WithPaginationResult<Omit<T, 'rowCount'>> {
	const total = rows[0]?.rowCount ?? 0
	const data = rows.map(({ rowCount: _, ...rest }) => rest)
	return {
		data,
		meta: {
			page: pq.page,
			limit: pq.limit,
			total,
			totalPages: Math.ceil(total / pq.limit),
		},
	}
}

export function sortBy(column: PgColumn, dir: 'asc' | 'desc' = 'desc') {
	return dir === 'asc' ? asc(column) : desc(column)
}

export function buildPaginationMeta(page: number, limit: number, total: number) {
	return { page, limit, total, totalPages: Math.ceil(total / limit) }
}

// ─── WHERE Composition ───

export function allOf(...conditions: (SQL | undefined)[]): SQL | undefined {
	const valid = conditions.filter((c): c is SQL => Boolean(c))
	if (valid.length === 0) return undefined
	if (valid.length === 1) return valid[0]
	return and(...valid)
}

export function anyOf(...conditions: (SQL | undefined)[]): SQL | undefined {
	const valid = conditions.filter((c): c is SQL => Boolean(c))
	if (valid.length === 0) return undefined
	if (valid.length === 1) return valid[0]
	return or(...valid)
}

export function eqIf<T>(column: PgColumn, value: T | undefined): SQL | undefined {
	if (value === undefined || value === null) return undefined
	return eq(column, value as Parameters<typeof eq>[1])
}

export function searchFilter(column: PgColumn, term: string | undefined): SQL | undefined {
	if (!term || term.trim() === '') return undefined
	const escaped = term.replace(/%/gu, '\\%').replace(/_/gu, '\\_')
	return ilike(column, `%${escaped}%`)
}

export function searchAcross(term: string | undefined, columns: PgColumn[]): SQL | undefined {
	if (!term || term.trim() === '') return undefined
	return anyOf(...columns.map((col) => searchFilter(col, term)))
}

// ─── Transaction ───

export async function withTransaction<T>(
	database: DbContext,
	fn: (tx: DbContext) => Promise<T>,
): Promise<T> {
	// neon-http does not support interactive transactions — use neon-serverless WebSocket for that
	// For now, execute sequentially (single-statement atomicity)
	return fn(database)
}

// ─── Conflict Check ───

export interface ConflictField<T> {
	field: keyof T
	column: PgColumn
	message: string
	code: string
}

export function defineConflictFields<T>() {
	return <F extends ConflictField<T>[]>(fields: F) => fields
}

export { sql, eq, and, or, ilike, inArray, asc, desc }
export type { PgTable, PgColumn, SQL }
