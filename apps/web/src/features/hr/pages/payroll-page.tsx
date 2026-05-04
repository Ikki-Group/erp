import { useState } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createColumnHelper } from '@tanstack/react-table'

import { DollarSignIcon, PlusIcon, SearchIcon } from 'lucide-react'
import { toast } from 'sonner'

import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { BadgeDot } from '@/components/blocks/data-display/badge-dot'
import { Page } from '@/components/layout/page'
import { customColumn, textColumn } from '@/components/reui/data-grid/data-grid-columns'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

import { payrollApi } from '../api'
import type { PayrollBatchDto, PayrollStatus } from '../dto'

function statusBadge(status: PayrollStatus) {
	switch (status) {
		case 'draft':
			return <BadgeDot variant="secondary">Draft</BadgeDot>
		case 'approved':
			return <BadgeDot variant="warning">Disetujui</BadgeDot>
		case 'paid':
			return <BadgeDot variant="success">Dibayar</BadgeDot>
		case 'cancelled':
			return <BadgeDot variant="destructive">Dibatalkan</BadgeDot>
	}
}

const ch = createColumnHelper<PayrollBatchDto>()

const columns = [
	ch.accessor(
		'name',
		customColumn({
			header: 'Periode',
			cell: (value, row) => (
				<div className="flex flex-col gap-0.5">
					<span className="font-semibold">{value}</span>
					<span className="text-xs text-muted-foreground">
						{row.periodMonth}/{row.periodYear}
					</span>
				</div>
			),
			size: 200,
		}),
	),
	ch.accessor(
		'status',
		textColumn({
			header: 'Status',
			size: 120,
			cell: (value) => statusBadge(value as PayrollStatus),
		}),
	),
	ch.accessor(
		'totalAmount',
		customColumn({
			header: 'Total',
			cell: (value) => (
				<span className="font-mono font-medium block text-right pr-4">
					Rp {Number(value).toLocaleString('id-ID')}
				</span>
			),
			size: 160,
		}),
	),
	ch.accessor('note', textColumn({ header: 'Catatan', size: 200 })),
]

export function PayrollPage() {
	const [search, setSearch] = useState('')

	const ds = useDataTableState()
	const { data, isLoading, refetch } = useQuery(
		payrollApi.list.query({ ...ds.pagination, q: search }),
	)

	const createMutation = useMutation({
		mutationFn: payrollApi.createBatch.mutationFn,
		onSuccess: () => {
			toast.success('Batch payroll berhasil dibuat')
			refetch()
		},
	})

	const finalizeMutation = useMutation({
		mutationFn: payrollApi.finalizeBatch.mutationFn,
		onSuccess: () => {
			toast.success('Batch payroll berhasil difinalisasi')
			refetch()
		},
	})

	const table = useDataTable({
		columns,
		data: data?.data ?? [],
		pageCount: data?.meta?.pageCount ?? 1,
		rowCount: data?.meta?.total ?? 0,
		ds,
	})

	const totalDraft = (data?.data ?? [])
		.filter((b) => b.status === 'draft')
		.reduce((s, b) => s + Number(b.totalAmount), 0)
	const totalApproved = (data?.data ?? [])
		.filter((b) => b.status === 'approved')
		.reduce((s, b) => s + Number(b.totalAmount), 0)
	const totalPaid = (data?.data ?? [])
		.filter((b) => b.status === 'paid')
		.reduce((s, b) => s + Number(b.totalAmount), 0)

	return (
		<Page size="xl">
			<Page.BlockHeader
				title="Penggajian (Payroll)"
				description="Kelola batch penggajian karyawan, finalisasi gaji, dan pantau status pembayaran."
			/>
			<Page.Content className="flex flex-col gap-6">
				<div className="grid gap-4 md:grid-cols-3">
					<Card>
						<Card.Header className="flex flex-row items-center justify-between pb-2">
							<Card.Title className="text-sm font-medium text-muted-foreground">
								Total Draft
							</Card.Title>
							<DollarSignIcon className="h-4 w-4 text-muted-foreground" />
						</Card.Header>
						<Card.Content>
							<div className="text-2xl font-bold font-mono">
								Rp {totalDraft.toLocaleString('id-ID')}
							</div>
						</Card.Content>
					</Card>
					<Card>
						<Card.Header className="flex flex-row items-center justify-between pb-2">
							<Card.Title className="text-sm font-medium text-muted-foreground">
								Total Disetujui
							</Card.Title>
							<DollarSignIcon className="h-4 w-4 text-amber-500" />
						</Card.Header>
						<Card.Content>
							<div className="text-2xl font-bold font-mono text-amber-600">
								Rp {totalApproved.toLocaleString('id-ID')}
							</div>
						</Card.Content>
					</Card>
					<Card>
						<Card.Header className="flex flex-row items-center justify-between pb-2">
							<Card.Title className="text-sm font-medium text-muted-foreground">
								Total Dibayar
							</Card.Title>
							<DollarSignIcon className="h-4 w-4 text-emerald-500" />
						</Card.Header>
						<Card.Content>
							<div className="text-2xl font-bold font-mono text-emerald-600">
								Rp {totalPaid.toLocaleString('id-ID')}
							</div>
						</Card.Content>
					</Card>
				</div>

				<Card className="rounded-2xl shadow-sm border-muted/60">
					<div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
						<div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
							<div className="flex flex-col gap-1.5 min-w-[300px]">
								<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Pencarian
								</label>
								<div className="relative">
									<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
									<Input
										placeholder="Cari batch payroll..."
										className="pl-9 h-10 bg-secondary/30 border-transparent focus-visible:bg-background"
										value={search}
										onChange={(e) => setSearch(e.target.value)}
									/>
								</div>
							</div>
						</div>

						<div className="flex flex-col gap-1.5 sm:self-center">
							<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:block opacity-0">
								Aksi
							</label>
							<Button
								size="sm"
								className="h-10 shadow-md font-medium"
								onClick={() => {
									const now = new Date()
									createMutation.mutate({
										name: `Payroll ${now.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}`,
										periodMonth: now.getMonth() + 1,
										periodYear: now.getFullYear(),
									})
								}}
								disabled={createMutation.isPending}
							>
								<PlusIcon className="size-4 mr-2" /> Buat Batch Payroll
							</Button>
						</div>
					</div>
				</Card>

				<div className="rounded-2xl overflow-hidden border border-muted/60 shadow-sm">
					<DataTableCard
						title="Daftar Batch Payroll"
						table={table as any}
						isLoading={isLoading}
						recordCount={data?.meta?.total ?? 0}
					/>
				</div>
			</Page.Content>
		</Page>
	)
}
