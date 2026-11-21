import { describe, expect, it } from 'vitest'

import {
	listSearchSchema,
	searchToTableState,
	tableChangeToSearch,
	type ListSearch,
} from './list-search.ts'

describe('listSearchSchema', () => {
	it('defaults an empty search to page 1 with the default page size', () => {
		expect(listSearchSchema.parse({})).toEqual({ page: 1, pageSize: 10 })
	})

	it('coerces numeric strings from the URL', () => {
		expect(listSearchSchema.parse({ page: '3', pageSize: '25' })).toMatchObject({
			page: 3,
			pageSize: 25,
		})
	})

	it('keeps an optional search term and sort spec', () => {
		expect(listSearchSchema.parse({ q: 'kopi', sort: 'name:asc' })).toMatchObject({
			q: 'kopi',
			sort: 'name:asc',
		})
	})

	it('clamps page to a minimum of 1 and rejects absurd page sizes to the default', () => {
		expect(listSearchSchema.parse({ page: 0 }).page).toBe(1)
		expect(listSearchSchema.parse({ page: -5 }).page).toBe(1)
	})
})

describe('searchToTableState', () => {
	it('maps 1-based URL page to 0-based table pageIndex', () => {
		const state = searchToTableState({ page: 3, pageSize: 25 })
		expect(state.pagination).toEqual({ pageIndex: 2, pageSize: 25 })
	})

	it('maps q to the global filter, defaulting to empty string', () => {
		expect(searchToTableState({ page: 1, pageSize: 10, q: 'kopi' }).globalFilter).toBe('kopi')
		expect(searchToTableState({ page: 1, pageSize: 10 }).globalFilter).toBe('')
	})

	it('parses a "field:dir" sort string into a SortingState', () => {
		expect(searchToTableState({ page: 1, pageSize: 10, sort: 'name:desc' }).sorting).toEqual([
			{ id: 'name', desc: true },
		])
		expect(searchToTableState({ page: 1, pageSize: 10, sort: 'code:asc' }).sorting).toEqual([
			{ id: 'code', desc: false },
		])
	})

	it('yields empty sorting when no sort is present', () => {
		expect(searchToTableState({ page: 1, pageSize: 10 }).sorting).toEqual([])
	})
})

describe('tableChangeToSearch', () => {
	const current: ListSearch = { page: 2, pageSize: 10, q: 'kopi', sort: 'name:asc' }

	it('maps a pagination change back to 1-based page, preserving other fields', () => {
		const next = tableChangeToSearch(current, { pagination: { pageIndex: 4, pageSize: 25 } })
		expect(next).toEqual({ page: 5, pageSize: 25, q: 'kopi', sort: 'name:asc' })
	})

	it('resets to page 1 when the search term changes', () => {
		const next = tableChangeToSearch(current, { globalFilter: 'teh' })
		expect(next.page).toBe(1)
		expect(next.q).toBe('teh')
	})

	it('drops q entirely when the search term is cleared (keeps the URL clean)', () => {
		const next = tableChangeToSearch(current, { globalFilter: '' })
		expect(next.q).toBeUndefined()
	})

	it('resets to page 1 and serializes sorting when the sort changes', () => {
		const next = tableChangeToSearch(current, { sorting: [{ id: 'code', desc: true }] })
		expect(next.page).toBe(1)
		expect(next.sort).toBe('code:desc')
	})

	it('drops sort entirely when sorting is cleared', () => {
		const next = tableChangeToSearch(current, { sorting: [] })
		expect(next.sort).toBeUndefined()
	})
})
