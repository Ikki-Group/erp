import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { Page } from '@/components/layout/page'
import {
	actionColumn,
	createColumnHelper,
	dateColumn,
	statusColumn,
	textColumn,
} from '@/components/reui/data-grid/data-grid-columns'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'

import { Button } from '@/components/ui/button'

import type { SalesTypeDto } from '@/features/product'
import { salesTypeApi } from '@/features/product'
import { SalesTypeFormDialog } from '@/features/product/components/sales-type-form-dialog'

import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

import { PencilIcon } from 'lucide-react'

export const Route = createFileRoute('/_app/product/sales-type')({ component: RouteComponent })

function RouteComponent() {
	return (
		<Page>
			<Page.BlockHeader
				title="Jenis Penjualan"
				description="Pengaturan jenis penjualan untuk mengklasifikasikan transaksi dan pelaporan pendapatan."
			/>
			<Page.Content>
				<SalesTypeFormDialog.Root />
				<SalesTypeTable />
			</Page.Content>
		</Page>
	)
}

const ch = createColumnHelper<SalesTypeDto>()

const columns = [
	ch.accessor('code', textColumn({ header: 'Kode', size: 120 })),
	ch.accessor(
		'name',
		statusColumn({
			header: 'Jenis Penjualan',
			render: (value, row) => (
				<div className="flex flex-col gap-1 py-1">
					<div className="flex items-center gap-2">
						<span className="font-semibold text-sm tracking-tight">{value}</span>
						{row.isSystem && (
							<span className="px-1.5 py-0.5 rounded-sm bg-blue-100 dark:bg-blue-900/30 text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-tighter leading-none">
								System
							</span>
						)}
					</div>
				</div>
			),
			size: 300,
		}),
	),
	ch.accessor('createdAt', dateColumn({ header: 'Dibuat Pada', size: 180 })),
	ch.display(
		actionColumn<SalesTypeDto>({
			id: 'action',
			cell: ({ row }) => {
				if (row.original.isSystem) return null
				return (
					<div className="flex items-center justify-end px-2">
						<Button
							variant="ghost"
							size="icon-sm"
							className="size-8 text-muted-foreground hover:text-foreground"
							onClick={() => {
								void SalesTypeFormDialog.upsert({ id: row.original.id })
							}}
						>
							<PencilIcon className="size-4" />
						</Button>
					</div>
				)
			},
		}),
	),
]

function SalesTypeTable() {
	const ds = useDataTableState()
	const { data, isLoading } = useQuery(salesTypeApi.list.query({ ...ds.pagination, q: ds.search }))

	const table = useDataTable({
		columns: columns,
		data: data?.data ?? [],
		pageCount: data?.meta.totalPages ?? 0,
		rowCount: data?.meta.total ?? 0,
		ds,
	})

	return (
		<DataTableCard
			title="Daftar Jenis Penjualan"
			table={table}
			isLoading={isLoading}
			recordCount={data?.meta.total ?? 0}
			toolbar={
				<DataGridFilter
					ds={ds}
					options={[{ type: 'search', placeholder: 'Cari jenis penjualan...' }]}
				/>
			}
			action={
				<Button
					size="sm"
					onClick={() => {
						void SalesTypeFormDialog.upsert({})
					}}
				>
					Tambah Tipe
				</Button>
			}
		/>
	)
}
