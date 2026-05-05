import { useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { createColumnHelper } from '@tanstack/react-table'

import { FlameIcon, SearchIcon, TagIcon } from 'lucide-react'

import { useDataTable } from '@/hooks/use-data-table'

import { toDateTimeStamp } from '@/lib/formatter'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { BadgeDot } from '@/components/blocks/data-display/badge-dot'
import { Page } from '@/components/layout/page'

import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

import { expenditureApi } from '../api'
import { ExpenditureDialog } from '../components/expenditure-dialog'
import type { ExpenditureDto } from '../dto/expenditure.dto'

const ch = createColumnHelper<ExpenditureDto>()

const columns = [
	ch.accessor('id', {
		header: 'Ref ID',
		size: 100,
		cell: ({ row }) => (
			<span className="font-mono text-muted-foreground">
				EXP-{row.original.id.toString().padStart(6, '0')}
			</span>
		),
	}),
	ch.accessor('date', {
		header: 'Tanggal',
		size: 120,
		cell: ({ row }) => (
			<span className="text-sm font-medium">
				{toDateTimeStamp(row.original.date.toString()).split(',')[0]}
			</span>
		),
	}),
	ch.accessor('title', {
		header: 'Keterangan Biaya',
		cell: ({ row }) => (
			<div className="flex flex-col gap-0.5">
				<span className="font-medium">{row.original.title}</span>
				{row.original.description && (
					<span className="text-xs text-muted-foreground">{row.original.description}</span>
				)}
			</div>
		),
	}),
	ch.accessor('category', {
		header: 'Kategori',
		size: 130,
		cell: ({ row }) => (
			<BadgeDot variant="secondary" className="text-xs">
				{row.original.category}
			</BadgeDot>
		),
	}),
	ch.accessor('amount', {
		header: 'Jumlah',
		size: 130,
		cell: ({ row }) => (
			<span className="font-semibold text-red-600 dark:text-red-400">
				-Rp {Number(row.original.amount).toLocaleString('id-ID')}
			</span>
		),
	}),
]

export function FinanceExpensesPage() {
	const [search, setSearch] = useState('')
	const [isDialogOpen, setIsDialogOpen] = useState(false)

	const { data: expensesData, isLoading } = useQuery(
		expenditureApi.list.query({ page: 1, limit: 50, q: search }),
	)

	const expenses = expensesData?.data ?? []
	const rowCount = expensesData?.meta?.total ?? 0

	const table = useDataTable({
		columns,
		data: expenses,
		pageCount: Math.ceil(rowCount / 50),
		rowCount,
		ds: { pagination: { limit: 50, page: 1 }, search, filters: {} } as any,
	})

	return (
		<Page size="xl">
			<Page.BlockHeader
				title="Pengeluaran Operasional"
				description="Catat dan kelola semua biaya operasional bisnis Anda."
			/>
			<Page.Content className="flex flex-col gap-6">
				<Card className="p-4">
					<div className="flex gap-3">
						<div className="relative flex-1">
							<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Cari pengeluaran..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="pl-10"
							/>
						</div>
						<ExpenditureDialog
							open={isDialogOpen}
							onOpenChange={setIsDialogOpen}
							onSuccess={() => setIsDialogOpen(false)}
						>
							<FlameIcon className="mr-2 h-4 w-4" />
							Tambah Biaya
						</ExpenditureDialog>
					</div>
				</Card>
				<DataTableCard
					title="Daftar Pengeluaran"
					table={table as any}
					isLoading={isLoading}
					recordCount={rowCount}
				/>
			</Page.Content>
		</Page>
	)
}
