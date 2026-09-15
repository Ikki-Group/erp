/**
 * Minimal in-memory "table" used by mock resource routes. Not persisted —
 * state resets on full page reload, which is fine for design-review use.
 */

let nextId = 1000

function createId(): number {
	nextId += 1
	return nextId
}

export interface MockTable<T extends { id: number }> {
	all: () => T[]
	get: (id: number) => T | undefined
	insert: (row: Omit<T, 'id'> & { id?: number }) => T
	update: (id: number, patch: Partial<T>) => T | undefined
	remove: (id: number) => boolean
}

export function createTable<T extends { id: number }>(seed: T[]): MockTable<T> {
	const rows = new Map<number, T>(seed.map((row) => [row.id, row]))

	return {
		all: () => Array.from(rows.values()),
		get: (id) => rows.get(id),
		insert: (row) => {
			const id = row.id ?? createId()
			const record = { ...row, id } as T
			rows.set(id, record)
			return record
		},
		update: (id, patch) => {
			const existing = rows.get(id)
			if (!existing) return undefined
			const next = { ...existing, ...patch }
			rows.set(id, next)
			return next
		},
		remove: (id) => rows.delete(id),
	}
}

export function paginate<T>(items: T[], page: number, limit: number): T[] {
	const start = (page - 1) * limit
	return items.slice(start, start + limit)
}
