import { useState } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { BadgeDot } from '@/components/blocks/data-display/badge-dot'
import { SectionErrorBoundary } from '@/components/blocks/feedback/section-error-boundary'
import { Page } from '@/components/layout/page'
import {
	createColumnHelper,
	dateColumn,
	statusColumn,
	textColumn,
} from '@/components/reui/data-grid/data-grid-columns'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'

import { workOrderApi } from '@/features/production/api/production.api'
import { WorkOrderSelectDto } from '@/features/production/dto/work-order.dto'

import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

import {
	ActivityIcon,
	CalendarCheckIcon,
	CheckCircleIcon,
	PlayIcon,
	PlusIcon,
	TimerIcon,
} from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_app/production/work-orders')({ component: WorkOrdersPage })

const ch = createColumnHelper<WorkOrderSelectDto>()

function WorkOrdersPage() {
	const ds = useDataTableState()
	const { data, isLoading, refetch } = useQuery(
		workOrderApi.list.query({ ...ds.filters, q: ds.search, ...ds.pagination }),
	)

	const [completeWoId, setCompleteWoId] = useState<number | null>(null)
	const [actualQty, setActualQty] = useState('')

	const startMutation = useMutation({
		mutationFn: workOrderApi.start.mutationFn,
		onSuccess: () => {
			toast.success('Work Order started')
			refetch()
		},
	})

	const completeMutation = useMutation({
		mutationFn: workOrderApi.complete.mutationFn,
		onSuccess: () => {
			toast.success('Work Order completed and stock updated')
			setCompleteWoId(null)
			setActualQty('')
			refetch()
		},
	})

	const columns = [
		ch.accessor('id', textColumn({ header: 'No. WO', size: 100 })),
		ch.accessor('recipeName', textColumn({ header: 'Resep/Menu', size: 200 })),
		ch.accessor('productName', textColumn({ header: 'Produk Jadi', size: 200 })),
		ch.accessor(
			'expectedQty',
			statusColumn({
				header: 'Target Qty',
				render: (value) => (
					<span className="font-bold tabular-nums text-foreground/80 pr-4">{value}</span>
				),
				size: 130,
			}),
		),
		ch.accessor('createdAt', dateColumn({ header: 'Dibuat Pada', size: 160 })),
		ch.accessor(
			'status',
			statusColumn({
				header: 'Status',
				render: (value) => {
					const status = value as string
					if (status === 'completed') return <BadgeDot variant="success-outline">Selesai</BadgeDot>
					if (status === 'in_progress')
						return <BadgeDot variant="warning-outline">Berjalan</BadgeDot>
					if (status === 'draft') return <BadgeDot variant="primary-outline">Draft</BadgeDot>
					return <BadgeDot variant="destructive-outline">{status}</BadgeDot>
				},
				size: 130,
			}),
		),
		ch.display({
			id: 'actions',
			header: 'Aksi',
			cell: ({ row }) => {
				const wo = row.original
				if (wo.status === 'draft') {
					return (
						<Button
							size="xs"
							variant="outline"
							className="text-primary border-primary/20 hover:bg-primary/5"
							onClick={() => startMutation.mutate({ params: { id: wo.id } })}
							disabled={startMutation.isPending}
						>
							<PlayIcon className="size-3 mr-1" /> Mulai
						</Button>
					)
				}
				if (wo.status === 'in_progress') {
					return (
						<Button
							size="xs"
							variant="outline"
							className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
							onClick={() => {
								setCompleteWoId(wo.id)
								setActualQty(wo.expectedQty.toString())
							}}
						>
							<CheckCircleIcon className="size-3 mr-1" /> Selesaikan
						</Button>
					)
				}
				return null
			},
			size: 150,
		}),
	]

	const table = useDataTable({
		columns,
		data: data?.data ?? [],
		pageCount: data?.meta.totalPages ?? 0,
		rowCount: data?.meta.total ?? 0,
		ds,
	})

	return (
		<Page>
			<Page.BlockHeader
				title="Perintah Kerja (Work Orders)"
				description="Manajemen jadwal produksi dan eksekusi batch untuk barang setengah jadi dan jadi."
			/>
			<Page.Content className="flex flex-col gap-6">
				{/* Metric Cards Dashboard */}
				<div className="grid gap-4 md:grid-cols-3">
					<Card>
						<Card.Header className="flex flex-row items-center justify-between pb-2">
							<Card.Title className="text-sm font-medium text-muted-foreground">
								Persentase Selesai
							</Card.Title>
							<ActivityIcon className="h-4 w-4 text-emerald-500" />
						</Card.Header>
						<Card.Content>
							{isLoading ? (
								<Skeleton className="h-8 w-20" />
							) : (
								<div className="text-2xl font-bold font-mono tracking-tight">
									{data?.data.length ?? 0} WO
								</div>
							)}
							<p className="text-xs text-muted-foreground mt-1">Total tugas produksi</p>
						</Card.Content>
					</Card>
					<SectionErrorBoundary title="Statistik Berjalan">
						<Card className="border-muted/60 shadow-sm overflow-hidden">
							<Card.Header className="flex flex-row items-center justify-between pb-2 bg-amber-50/50 dark:bg-amber-950/20">
								<Card.Title className="text-sm font-semibold text-amber-800 dark:text-amber-400">
									Aktif (In Progress)
								</Card.Title>
								<TimerIcon className="h-4 w-4 text-amber-500" />
							</Card.Header>
							<Card.Content>
								{isLoading ? (
									<Skeleton className="h-8 w-16" />
								) : (
									<div className="text-2xl font-bold font-mono tracking-tight">
										{data?.data.filter((d) => d.status === 'in_progress').length ?? 0} WO
									</div>
								)}
								<p className="text-xs text-muted-foreground mt-1">Bahan baku dialokasikan</p>
							</Card.Content>
						</Card>
					</SectionErrorBoundary>
					<SectionErrorBoundary title="Statistik Rencana">
						<Card className="border-muted/60 shadow-sm overflow-hidden">
							<Card.Header className="flex flex-row items-center justify-between pb-2 bg-blue-50/50 dark:bg-blue-950/20">
								<Card.Title className="text-sm font-semibold text-blue-800 dark:text-blue-400">
									Draft / Rencana
								</Card.Title>
								<CalendarCheckIcon className="h-4 w-4 text-blue-500" />
							</Card.Header>
							<Card.Content>
								{isLoading ? (
									<Skeleton className="h-8 w-16" />
								) : (
									<div className="text-2xl font-bold font-mono tracking-tight">
										{data?.data.filter((d) => d.status === 'draft').length ?? 0} Rencana
									</div>
								)}
								<p className="text-xs text-muted-foreground mt-1">Siap untuk diproduksi</p>
							</Card.Content>
						</Card>
					</SectionErrorBoundary>
				</div>

				<SectionErrorBoundary title="Tabel Perintah Kerja">
					<DataTableCard
						title="Daftar Work Orders"
						table={table}
						isLoading={isLoading}
						recordCount={data?.meta.total ?? 0}
						toolbar={
							<DataGridFilter
								ds={ds}
								options={[{ type: 'search', placeholder: 'Cari No. WO...' }]}
							/>
						}
						action={
							<Button size="sm" className="h-10 shadow-md font-medium">
								<PlusIcon className="size-4 mr-2" /> Buat WO Baru
							</Button>
						}
					/>
				</SectionErrorBoundary>
			</Page.Content>

			<Dialog open={!!completeWoId} onOpenChange={(open) => !open && setCompleteWoId(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Selesaikan Work Order</DialogTitle>
						<DialogDescription>
							Masukkan jumlah aktual (yield) hasil produksi. Pastikan bahan baku telah tercatat
							dengan benar.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="actualQty" className="text-right">
								Qty Aktual
							</Label>
							<Input
								id="actualQty"
								type="number"
								value={actualQty}
								onChange={(e) => setActualQty(e.target.value)}
								className="col-span-3"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setCompleteWoId(null)}>
							Batal
						</Button>
						<Button
							variant="default"
							className="bg-emerald-600 hover:bg-emerald-700 text-white"
							onClick={() =>
								completeWoId &&
								completeMutation.mutate({ params: { id: completeWoId }, body: { actualQty } })
							}
							disabled={completeMutation.isPending}
						>
							Konfirmasi & Tutup WO
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Page>
	)
}
