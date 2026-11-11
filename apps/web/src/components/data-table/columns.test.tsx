import type { ColumnDef } from '@tanstack/react-table'

// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'

import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'

import { createEntityColumns } from './columns'
import { DataTable } from './data-table'
import { useClientTable } from './use-client-table'

type Item = {
	code: string
	name: string | null
	quantity: string | null
	cost: number | null
	date: string | null
	status: 'draft' | 'posted' | null
	isActive: boolean | null
}
const col = createEntityColumns<Item>()
const columns = [
	col.code('code', { header: 'Code' }),
	col.text('name', { header: 'Name', cellProps: { truncate: false } }),
	col.quantity('quantity', { header: 'Quantity' }),
	col.money('cost', { header: 'Cost' }),
	col.date('date', { header: 'Date' }),
	col.status(
		'status',
		{
			draft: { label: 'Draft', variant: 'outline' },
			posted: { label: 'Posted', variant: 'success' },
		},
		{ header: 'Status' },
	),
	col.booleanStatus('isActive', { header: 'Active' }),
] as ColumnDef<DataGridFeatures, Item>[]

const rows: Item[] = [
	{
		code: 'MAT-001',
		name: 'Coffee',
		quantity: '1250.5',
		cost: null,
		date: null,
		status: 'posted',
		isActive: false,
	},
	{
		code: 'MAT-002',
		name: null,
		quantity: null,
		cost: null,
		date: null,
		status: null,
		isActive: null,
	},
]

function Table() {
	const list = useClientTable({ data: rows, columns })
	return <DataTable table={list.table} recordCount={rows.length} />
}

afterEach(cleanup)

it('renders decimal-string quantities, mapped statuses, explicit false, and null placeholders', () => {
	render(<Table />)
	expect(screen.getByText('1.250,5').className).toContain('text-right')
	expect(screen.getByText('Quantity').className).toContain('text-right')
	expect(screen.getByText('MAT-001').className).toContain('font-mono')
	expect(screen.getByText('Posted')).toBeTruthy()
	expect(screen.getByText('Inactive')).toBeTruthy()
	expect(screen.getAllByText('—')).toHaveLength(8)
})
