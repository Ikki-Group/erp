import { createFileRoute } from '@tanstack/react-router'

import { PlusIcon } from 'lucide-react'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { Page } from '@/components/layout/page'
import {
	createColumnHelper,
	statusColumn,
	textColumn,
} from '@/components/reui/data-grid/data-grid-columns'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

export const Route = createFileRoute('/_app/sales/customers')({ component: SalesCustomersPage })

// Mock Data
const mockCustomers = [
	{
		id: 'CUST-001',
		name: 'PT. Maju Mundur',
		email: 'info@majumundur.com',
		phone: '081234567890',
		segment: 'B2B',
	},
	{
		id: 'CUST-002',
		name: 'Toko Sejahtera',
		email: 'sejahtera@gmail.com',
		phone: '085678901234',
		segment: 'Retail',
	},
	{
		id: 'CUST-003',
		name: 'CV. Karya Abadi',
		email: 'karya.abadi@yahoo.com',
		phone: '089012345678',
		segment: 'B2B',
	},
	{
		id: 'CUST-004',
		name: 'Bapak Budi',
		email: 'budisaja@gmail.com',
		phone: '081298765432',
		segment: 'B2C',
	},
]

type CustomerType = (typeof mockCustomers)[0]
const ch = createColumnHelper<CustomerType>()

const columns = [
	ch.accessor(
		'name',
		statusColumn({
			header: 'Pelanggan',
			render: (value, row) => (
				<div className="flex items-center gap-3">
					<Avatar className="h-8 w-8 rounded-lg">
						<AvatarFallback className="rounded-lg bg-primary/10 text-primary">
							{(value as string).slice(0, 2).toUpperCase()}
						</AvatarFallback>
					</Avatar>
					<div>
						<span className="font-medium">{value}</span>
						<p className="text-muted-foreground text-xs font-mono">{row.id}</p>
					</div>
				</div>
			),
			size: 250,
		}),
	),
	ch.accessor('email', textColumn({ header: 'Email', size: 200 })),
	ch.accessor('phone', textColumn({ header: 'No. HP', size: 150 })),
	ch.accessor(
		'segment',
		statusColumn({
			header: 'Segmen',
			render: (value) => (
				<span className="bg-muted px-2 py-1 rounded-md text-xs font-medium">{value}</span>
			),
			size: 100,
		}),
	),
]

function SalesCustomersPage() {
	const ds = useDataTableState()

	const table = useDataTable({
		columns,
		data: mockCustomers,
		pageCount: 1,
		rowCount: mockCustomers.length,
		ds,
	})

	return (
		<Page>
			<Page.BlockHeader
				title="Data Pelanggan"
				description="Basis data pelanggan dari seluruh channel penjualan."
			/>
			<Page.Content>
				<DataTableCard
					title="Daftar Pelanggan"
					table={table}
					isLoading={false}
					recordCount={mockCustomers.length}
					action={
						<Button size="sm">
							<PlusIcon className="mr-2 h-4 w-4" /> Tambah Pelanggan
						</Button>
					}
				/>
			</Page.Content>
		</Page>
	)
}
