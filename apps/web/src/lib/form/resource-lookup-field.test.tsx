// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { useAppForm } from './app-form'
import { ResourceLookupField } from './resource-lookup-field'
import type { ResourceLookupAdapter } from './use-resource-lookup'

interface RecordItem {
	id: number
	name: string
}

const records: RecordItem[] = Array.from({ length: 125 }, (_, index) => ({
	id: index + 1,
	name: `Role ${index + 1}`,
}))

const adapter: ResourceLookupAdapter<RecordItem> = {
	listOptions: (query) => ({
		queryKey: ['exclusion-test', 'list', query],
		queryFn: async () => {
			const matching = records.filter((record) => !query.q || record.name.includes(query.q))
			return {
				success: true,
				code: 'OK',
				data: matching.slice((query.page - 1) * query.limit, query.page * query.limit),
				meta: {
					page: query.page,
					limit: query.limit,
					total: matching.length,
					totalPages: Math.ceil(matching.length / query.limit),
				},
			}
		},
	}),
	detailOptions: (id) => ({
		queryKey: ['exclusion-test', 'detail', id],
		queryFn: async () => {
			const record = records.find((item) => item.id === id)
			if (!record) throw new Error('Role not found')
			return { success: true, code: 'OK', data: record }
		},
	}),
	label: (record) => record.name,
}

function Lookup({ selectedId }: { selectedId: number | null }) {
	const form = useAppForm({ defaultValues: { roleId: selectedId } })
	return (
		<form.AppField name="roleId">
			{() => <ResourceLookupField adapter={adapter} label="Role" excludeIds={[1, 2, 125]} />}
		</form.AppField>
	)
}

function renderLookup(selectedId: number | null) {
	const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
	return render(
		<QueryClientProvider client={client}>
			<Lookup selectedId={selectedId} />
		</QueryClientProvider>,
	)
}

afterEach(cleanup)

describe('resource lookup exclusions', () => {
	it('hides another row selection but retains this field current selection in the options', async () => {
		renderLookup(1)
		const input = screen.getByRole<HTMLInputElement>('combobox', { name: 'Role' })
		await waitFor(() => expect(input.value).toBe('Role 1'))
		fireEvent.mouseDown(input, { button: 0 })
		await screen.findByRole('option', { name: 'Role 1' })
		expect(screen.queryByRole('option', { name: 'Role 2' })).toBeNull()
		expect(screen.getByRole('option', { name: 'Role 3' })).toBeTruthy()
	})

	it('resolves an excluded selection beyond the first hundred and keeps it selectable in search', async () => {
		renderLookup(125)
		const input = screen.getByRole<HTMLInputElement>('combobox', { name: 'Role' })
		await waitFor(() => expect(input.value).toBe('Role 125'))
		fireEvent.mouseDown(input, { button: 0 })
		fireEvent.change(input, { target: { value: '125' } })
		await screen.findByRole('option', { name: 'Role 125' })
		fireEvent.click(screen.getByRole('option', { name: 'Role 125' }))
		expect(input.value).toBe('Role 125')
	})
})
