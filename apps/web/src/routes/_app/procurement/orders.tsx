import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { ClipboardListIcon, ClockIcon, PlusIcon, TruckIcon } from 'lucide-react'

import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { BadgeDot } from '@/components/blocks/data-display/badge-dot'
import { SectionErrorBoundary } from '@/components/blocks/feedback/section-error-boundary'
import { Page } from '@/components/layout/page'
import {
	createColumnHelper,
	currencyColumn,
	dateColumn,
	customColumn,
	textColumn,
} from '@/components/reui/data-grid/data-grid-columns'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

import { purchaseOrderApi } from '@/features/purchasing/api/purchasing.api'
import { PurchaseOrderDto } from '@/features/purchasing/dto/purchase-order.dto'

export const Route = createFileRoute('/_app/procurement/orders')({
	component: ProcurementOrderPage,
})

const ch = createColumnHelper<PurchaseOrderDto>()

const columns = [
	ch.accessor('id', textColumn({ header: 'No. Pembelian', size: 130 })),
	ch.accessor('supplierId', textColumn({ header: 'Supplier ID', size: 100 })), // Simplified for now
	ch.accessor('transactionDate', dateColumn({ header: 'Tanggal Order', size: 160 })),
	ch.accessor('totalAmount', currencyColumn({ header: 'Total Tagihan', size: 160 })),
	ch.accessor(
		'status',
		customColumn({
			header: 'Status',
			cell: (value) => {
				const status = value as string
				if (status === 'completed') return <BadgeDot variant="success">Selesai</BadgeDot>
				if (status === 'open') return <BadgeDot variant="warning">Draf/Proses</BadgeDot>
				if (status === 'void') return <BadgeDot variant="destructive">Dibatalkan</BadgeDot>
				return <BadgeDot variant="secondary">{status}</BadgeDot>
			},
			size: 130,
		}),
	),
]

function ProcurementOrderPage() {
	const ds = useDataTableState()
	const { data, isLoading } = useQuery(
		purchaseOrderApi.list.query({ ...ds.filters, q: ds.search, ...ds.pagination }),
	)

	const table = useDataTable({
		columns,
		data: data?.data ?? [],
		pageCount: data?.meta.totalPages ?? 0,
		rowCount: data?.meta.total ?? 0,
		ds,
	})

	return (
		<Page size="xl">
			<Page.BlockHeader
				title="Pesanan Pembelian (PO)"
				description="Pantau status pemesanan ke Supplier dan kelola dokumen Purchase Order."
			/>
			<Page.Content className="flex flex-col gap-6">
				{/* Metric Cards */}
				<div className="grid gap-4 md:grid-cols-3">
					<Card>
						<Card.Header className="flex flex-row items-center justify-between pb-2">
							<Card.Title className="text-sm font-medium text-muted-foreground">
								Total Tagihan (Bulan Ini)
							</Card.Title>
							<ClipboardListIcon className="h-4 w-4 text-emerald-500" />
						</Card.Header>
						<Card.Content>
							{isLoading ? (
								<Skeleton className="h-8 w-20" />
							) : (
								<div className="text-2xl font-bold font-mono tracking-tight">
									{data?.data.length ?? 0} PO
								</div>
							)}
							<p className="text-xs text-muted-foreground mt-1">Total pesanan aktif</p>
						</Card.Content>
					</Card>
					<SectionErrorBoundary title="Statistik Order">
						<Card className="border-muted/60 shadow-sm overflow-hidden">
							<Card.Header className="flex flex-row items-center justify-between pb-2 bg-amber-50/50 dark:bg-amber-950/20">
								<Card.Title className="text-sm font-semibold text-amber-800 dark:text-amber-400">
									Terbuka (Open)
								</Card.Title>
								<ClockIcon className="h-4 w-4 text-amber-500" />
							</Card.Header>
							<Card.Content>
								{isLoading ? (
									<Skeleton className="h-8 w-16" />
								) : (
									<div className="text-2xl font-bold font-mono tracking-tight">
										{data?.data.filter((d) => d.status === 'open').length ?? 0} PO
									</div>
								)}
								<p className="text-xs text-muted-foreground mt-1">Menunggu pengiriman</p>
							</Card.Content>
						</Card>
					</SectionErrorBoundary>
					<SectionErrorBoundary title="Statistik Selesai">
						<Card className="border-muted/60 shadow-sm overflow-hidden">
							<Card.Header className="flex flex-row items-center justify-between pb-2 bg-blue-50/50 dark:bg-blue-950/20">
								<Card.Title className="text-sm font-semibold text-blue-800 dark:text-blue-400">
									Selesai (Closed)
								</Card.Title>
								<TruckIcon className="h-4 w-4 text-blue-500" />
							</Card.Header>
							<Card.Content>
								{isLoading ? (
									<Skeleton className="h-8 w-16" />
								) : (
									<div className="text-2xl font-bold font-mono tracking-tight">
										{data?.data.filter((d) => d.status === 'closed').length ?? 0} PO
									</div>
								)}
								<p className="text-xs text-muted-foreground mt-1">Stok telah masuk</p>
							</Card.Content>
						</Card>
					</SectionErrorBoundary>
				</div>

				<SectionErrorBoundary title="Tabel Pesanan Pembelian">
					<DataTableCard
						title="Daftar Pesanan Pembelian"
						table={table}
						isLoading={isLoading}
						recordCount={data?.meta.total ?? 0}
						toolbar={
							<DataGridFilter
								ds={ds}
								options={[{ type: 'search', placeholder: 'Cari nomor PO...' }]}
							/>
						}
						action={
							<Button size="sm" className="h-10 shadow-md font-medium">
								<PlusIcon className="size-4 mr-2" /> Buat PO Baru
							</Button>
						}
					/>
				</SectionErrorBoundary>
			</Page.Content>
		</Page>
	)
}
