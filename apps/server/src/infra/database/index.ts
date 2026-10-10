import { sql, eq, and, or, ilike, inArray, desc, gte, lte } from 'drizzle-orm'

import type { PaginationQuery } from '@/shared/types/pagination.ts'

import type { SQL } from 'drizzle-orm'
import type { PgColumn } from 'drizzle-orm/pg-core'

export { db } from './client.ts'
export { uow } from './uow.drizzle.ts'
export type { UnitOfWork } from './uow.drizzle.ts'
export type { DbContext, Tx } from './client.ts'
import type { DbContext, Tx } from './client.ts'
/** Anything a repo can query through: the root client or an open transaction. */
export type Db = DbContext | Tx

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

export function buildPaginationMeta(page: number, limit: number, total: number | string) {
	const t = Number(total)
	return { page, limit, total: t, totalPages: Math.ceil(t / limit) }
}

// ─── WHERE Composition ───

export function allOf(...conditions: (SQL | undefined)[]): SQL | undefined {
	const valid = conditions.filter((c): c is SQL => Boolean(c))
	if (valid.length === 0) return undefined
	if (valid.length === 1) return valid[0]
	return and(...valid)
}

export function eqIf<T>(column: PgColumn, value: T | undefined): SQL | undefined {
	if (value === undefined || value === null) return undefined
	return eq(column, value as Parameters<typeof eq>[1])
}

/** `column IN values`; null/undefined = no restriction, [] = matches nothing. */
export function inIf(column: PgColumn, values: number[] | null | undefined): SQL | undefined {
	return values ? inArray(column, values) : undefined
}

/** List filter narrowing to the actor's permitted locations (`Actor.allowedLocations()`). */
export interface LocationScope {
	locationIds?: number[] | null
}

export function searchFilter(column: PgColumn, term: string | undefined): SQL | undefined {
	if (!term || term.trim() === '') return undefined
	const escaped = term.replace(/%/gu, '\\%').replace(/_/gu, '\\_')
	return ilike(column, `%${escaped}%`)
}

export function searchAcross(term: string | undefined, columns: PgColumn[]): SQL | undefined {
	if (!term || term.trim() === '') return undefined
	return or(...columns.map((col) => searchFilter(col, term)))
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

export { sql, eq, and, or, inArray, desc, gte, lte }
export type { PgColumn, SQL }
