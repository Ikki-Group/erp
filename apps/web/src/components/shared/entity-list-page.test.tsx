// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'

import type { ResourceListQuery } from '@/components/data-table/resource-list-state'
import { useResourceList } from '@/components/data-table/use-resource-list'

import { EntityListPage } from './entity-list-page'

const columns = [{ accessorKey: 'name' as const, header: 'Name' }]
const search = { page: 1, pageSize: 10 }
const loaded: ResourceListQuery<{ name: string }> = {
	data: { data: [{ name: 'Coffee beans' }], meta: { total: 1 } },
	isPending: false,
	isFetching: false,
	isError: false,
	refetch: () => undefined,
}

function List({ query, filtered = false }: { query: typeof loaded; filtered?: boolean }) {
	const list = useResourceList({
		query,
		columns,
		search,
		onSearchChange: () => undefined,
		hasFilters: () => filtered,
	})
	return (
		<EntityListPage
			title="Materials"
			list={list}
			createAction={<button>Add Material</button>}
			emptyState={{ title: 'No materials yet' }}
			emptyMessage="No matching materials"
			toolbar={<input aria-label="Search materials" />}
		/>
	)
}

afterEach(cleanup)

it('keeps header actions and search available for initial failures without an empty prompt', () => {
	let retries = 0
	render(
		<List
			query={{
				...loaded,
				data: undefined,
				isError: true,
				refetch: () => {
					retries++
				},
			}}
		/>,
	)
	expect(screen.getByRole('button', { name: 'Add Material' })).toBeTruthy()
	expect(screen.getByRole('textbox', { name: 'Search materials' })).toBeTruthy()
	expect(screen.queryByText('No materials yet')).toBeNull()
	fireEvent.click(screen.getByRole('button', { name: /try again|retry/iu }))
	expect(retries).toBe(1)
})

it('renders retained rows with an inline retry after a refresh failure', () => {
	let retries = 0
	const { rerender } = render(<List query={loaded} />)
	expect(screen.getByText('Coffee beans')).toBeTruthy()
	rerender(<List query={{ ...loaded, isFetching: true }} />)
	expect(screen.getByText('Coffee beans')).toBeTruthy()
	rerender(
		<List
			query={{
				...loaded,
				isError: true,
				refetch: () => {
					retries++
				},
			}}
		/>,
	)
	expect(screen.getByText('Coffee beans')).toBeTruthy()
	expect(screen.getByRole('alert').textContent).toContain('last loaded results')
	fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
	expect(retries).toBe(1)
})

it('reuses create action for record-empty but not filtered-empty and keeps search in both', () => {
	const query = { ...loaded, data: { data: [], meta: { total: 0 } } }
	const { rerender } = render(<List query={query} />)
	expect(screen.getAllByRole('button', { name: 'Add Material' })).toHaveLength(2)
	expect(screen.getByText('No materials yet')).toBeTruthy()
	expect(screen.getByRole('textbox', { name: 'Search materials' })).toBeTruthy()
	rerender(<List query={query} filtered />)
	expect(screen.getAllByRole('button', { name: 'Add Material' })).toHaveLength(1)
	expect(screen.getByText('No matching materials')).toBeTruthy()
	expect(screen.getByRole('textbox', { name: 'Search materials' })).toBeTruthy()
})
