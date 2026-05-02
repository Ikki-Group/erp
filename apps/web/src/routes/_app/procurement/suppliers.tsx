import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'

import { PlusIcon } from 'lucide-react'

import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { Page } from '@/components/layout/page'
import { customColumn, textColumn } from '@/components/reui/data-grid/data-grid-columns'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'

import { Button } from '@/components/ui/button'

import { supplierApi } from '@/features/supplier'
import type { SupplierDto } from '@/features/supplier'

export const Route = createFileRoute('/_app/procurement/suppliers')({ component: SuppliersPage })

const ch = createColumnHelper<SupplierDto>()

const columns = [
	ch.accessor(
		'name',
		customColumn({
			header: 'Nama Pemasok',
			cell: (value, row) => (
				<div className="flex flex-col gap-1">
					<span className="font-semibold text-foreground/90">{value}</span>
					<p className="text-[11px] text-muted-foreground font-mono tracking-tight">{row.code}</p>
				</div>
			),
			size: 250,
		}),
	),
	ch.accessor('phone', textColumn({ header: 'Telepon', size: 150 })),
	ch.accessor('email', textColumn({ header: 'Email', size: 200 })),
	ch.accessor('address', textColumn({ header: 'Alamat', size: 250 })),
]

function SuppliersPage() {
	const ds = useDataTableState()
	const { data: suppliersData, isLoading } = useQuery(
		supplierApi.list.query({ ...ds.pagination, q: ds.search }),
	)

	const suppliers = suppliersData?.data ?? []
	const rowCount = suppliersData?.meta?.total ?? 0

	const table = useDataTable({
		columns,
		data: suppliers,
		pageCount: Math.ceil(rowCount / ds.pagination.limit),
		rowCount,
		ds,
	})

	return (
		<Page size="xl">
			<Page.BlockHeader
				title="Data Supplier"
				description="Direktori kelola vendor bahan baku dan layanan operasional Anda."
			/>
			<Page.Content>
				<DataTableCard
					title="Daftar Supplier"
					table={table as any}
					isLoading={isLoading}
					recordCount={rowCount}
					toolbar={
						<DataGridFilter
							ds={ds}
							options={[{ type: 'search', placeholder: 'Cari supplier...' }]}
						/>
					}
					action={
						<Button size="sm" className="h-10 shadow-md font-medium">
							<PlusIcon className="size-4 mr-2" /> Tambah Supplier
						</Button>
					}
				/>
			</Page.Content>
		</Page>
	)
}
