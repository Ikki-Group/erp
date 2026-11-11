import { useMutation, useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'

import { CheckCircleIcon, PlusIcon, ReceiptIcon, TimerIcon } from 'lucide-react'
import { toast } from 'sonner'

import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { BadgeDot } from '@/components/blocks/data-display/badge-dot'
import { SectionErrorBoundary } from '@/components/blocks/feedback/section-error-boundary'
import { Page } from '@/components/layout/page'
import { CellDate } from '@/components/reui/data-grid/data-grid-cell'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

import { goodsReceiptApi } from '../api'
import type { GoodsReceiptNoteDto } from '../dto'

export function ReceiptsPage() {
	const ds = useDataTableState()
	const { data, isLoading, refetch } = useQuery(
		goodsReceiptApi.list.query({ ...ds.filters, q: ds.search, ...ds.pagination }),
	)

	const completeMutation = useMutation({
		mutationFn: goodsReceiptApi.complete.mutationFn,
		onSuccess: () => {
			toast.success('Penerimaan barang diselesaikan. Stok inventori telah diperbarui.')
			refetch()
		},
	})

	const columns: ColumnDef<GoodsReceiptNoteDto>[] = [
		{
			accessorKey: 'id',
			header: 'No. Penerimaan',
			size: 140,
		},
		{
			accessorKey: 'referenceNumber',
			header: 'Ref/Surat Jalan',
			size: 180,
		},
		{
			accessorKey: 'receiveDate',
			header: 'Tanggal Terima',
			size: 160,
			cell: ({ row }) => <CellDate value={row.original.receiveDate} />,
		},
		{
			accessorKey: 'status',
			header: 'Status',
			size: 130,
			cell: ({ row }) => {
				const status = row.original.status
				if (status === 'completed') return <BadgeDot variant="success">Selesai</BadgeDot>
				if (status === 'open') return <BadgeDot variant="warning">Draf/Proses</BadgeDot>
				if (status === 'void') return <BadgeDot variant="destructive">Dibatalkan</BadgeDot>
				return <BadgeDot variant="secondary">{status}</BadgeDot>
			},
		},
		{
			id: 'actions',
			header: 'Aksi',
			size: 150,
			enableSorting: false,
			enableHiding: false,
			cell: ({ row }) => {
				const grn = row.original
				if (grn.status === 'open') {
					return (
						<Button
							size="xs"
							variant="outline"
							className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
							onClick={() => completeMutation.mutate({ params: { id: grn.id } })}
							disabled={completeMutation.isPending}
						>
							<CheckCircleIcon className="size-3 mr-1" /> Selesaikan
						</Button>
					)
				}
				return null
			},
		},
	]

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
				title="Penerimaan Barang (GRN)"
				description="Pantau dan verifikasi barang yang diterima dari Supplier sebelum masuk ke stok gudang."
			/>
			<Page.Content className="flex flex-col gap-6">
				{/* Metric Cards */}
				<div className="grid gap-4 md:grid-cols-3">
					<Card>
						<Card.Header className="flex flex-row items-center justify-between pb-2">
							<Card.Title className="text-sm font-medium text-muted-foreground">
								Total Penerimaan
							</Card.Title>
							<ReceiptIcon className="h-4 w-4 text-emerald-500" />
						</Card.Header>
						<Card.Content>
							{isLoading ? (
								<Skeleton className="h-8 w-20" />
							) : (
								<div className="text-2xl font-bold font-mono tracking-tight">
									{data?.data.length ?? 0} GRN
								</div>
							)}
							<p className="text-xs text-muted-foreground mt-1">Total penerimaan</p>
						</Card.Content>
					</Card>
					<SectionErrorBoundary title="Statistik Menunggu">
						<Card className="border-muted/60 shadow-sm overflow-hidden">
							<Card.Header className="flex flex-row items-center justify-between pb-2 bg-amber-50/50 dark:bg-amber-950/20">
								<Card.Title className="text-sm font-semibold text-amber-800 dark:text-amber-400">
									Menunggu (Open)
								</Card.Title>
								<TimerIcon className="h-4 w-4 text-amber-500" />
							</Card.Header>
							<Card.Content>
								{isLoading ? (
									<Skeleton className="h-8 w-16" />
								) : (
									<div className="text-2xl font-bold font-mono tracking-tight">
										{data?.data.filter((d) => d.status === 'open').length ?? 0} GRN
									</div>
								)}
								<p className="text-xs text-muted-foreground mt-1">Siap untuk diverifikasi</p>
							</Card.Content>
						</Card>
					</SectionErrorBoundary>
					<SectionErrorBoundary title="Statistik Selesai">
						<Card className="border-muted/60 shadow-sm overflow-hidden">
							<Card.Header className="flex flex-row items-center justify-between pb-2 bg-emerald-50/50 dark:bg-emerald-950/20">
								<Card.Title className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">
									Selesai (Completed)
								</Card.Title>
								<CheckCircleIcon className="h-4 w-4 text-emerald-500" />
							</Card.Header>
							<Card.Content>
								{isLoading ? (
									<Skeleton className="h-8 w-16" />
								) : (
									<div className="text-2xl font-bold font-mono tracking-tight">
										{data?.data.filter((d) => d.status === 'completed').length ?? 0} GRN
									</div>
								)}
								<p className="text-xs text-muted-foreground mt-1">Stok telah diperbarui</p>
							</Card.Content>
						</Card>
					</SectionErrorBoundary>
				</div>

				<SectionErrorBoundary title="Tabel Penerimaan Barang">
					<DataTableCard
						title="Daftar Penerimaan Barang"
						table={table}
						isLoading={isLoading}
						recordCount={data?.meta.total ?? 0}
						toolbar={
							<DataGridFilter
								ds={ds}
								options={[{ type: 'search', placeholder: 'Cari nomor GRN atau Ref...' }]}
							/>
						}
						action={
							<Button size="sm" className="h-10 shadow-md font-medium">
								<PlusIcon className="size-4 mr-2" /> Terima Barang Baru
							</Button>
						}
					/>
				</SectionErrorBoundary>
			</Page.Content>
		</Page>
	)
}
