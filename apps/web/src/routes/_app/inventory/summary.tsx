import { useMemo, useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { startOfMonth, startOfDay } from 'date-fns'
import {
	AlertCircleIcon,
	BoxIcon,
	MoveDownIcon,
	MoveUpIcon,
	SearchIcon,
	TrendingUpIcon,
} from 'lucide-react'

import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

import { arrayToOptions } from '@/lib/utils'

import { CardSection } from '@/components/blocks/card/card-section'
import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { ComboboxStatic } from '@/components/blocks/combobox-pattern'
import { SectionErrorBoundary } from '@/components/blocks/feedback/section-error-boundary'
import { Page } from '@/components/layout/page'
import { Badge } from '@/components/reui/badge'
import { createColumnHelper, currencyColumn } from '@/components/reui/data-grid/data-grid-columns'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DateRangePickerV2 } from '@/components/ui/date-range-picker-v2'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

import type { StockLedgerSelectDto } from '@/features/inventory'
import { stockSummaryApi, stockDashboardApi } from '@/features/inventory'
import { locationApi } from '@/features/location'

import type { DateRange } from 'react-day-picker'

export const Route = createFileRoute('/_app/inventory/summary')({ component: RouteComponent })

function RouteComponent() {
	const ds = useDataTableState()
	const [locationId, setLocationId] = useState<number | undefined>()

	const [range, setRange] = useState<DateRange | undefined>(() => ({
		from: startOfDay(startOfMonth(new Date())),
		to: startOfDay(new Date()),
	}))

	const { data: kpiData, isLoading: kpiLoading } = useQuery(
		stockDashboardApi.kpi.query({ locationId }),
	)
	const kpi = kpiData?.data

	const locationQry = useQuery({
		...locationApi.list.query({}),
		select: (res) =>
			arrayToOptions({
				items: res.data,
				getValue: (i) => i.id,
				getLabel: (i) => i.name,
			}),
	})

	return (
		<Page size="xl">
			<Page.BlockHeader
				title="Dashboard Inventori"
				description="Monitor pergerakan stok, nilai aset, dan peringatan stok bahan baku."
			/>
			<Page.Content className="flex flex-col gap-6">
				{/* Metric Cards Dashboard */}
				<div className="grid gap-4 md:grid-cols-3">
					<KpiCard
						title="Total Nilai Stok"
						description="Estimasi nilai aset saat ini"
						icon={<TrendingUpIcon className="text-emerald-500" />}
						loading={kpiLoading}
						value={kpi ? `Rp ${kpi.totalStockValue.toLocaleString('id-ID')}` : '0'}
					/>
					<KpiCard
						title="Total Bahan (SKU)"
						description="Stok aktif di lokasi terpilih"
						icon={<BoxIcon className="text-blue-500" />}
						loading={kpiLoading}
						value={kpi?.totalActiveSku ?? '0'}
					/>
					<KpiCard
						title="Peringatan Stok Tipis"
						description="Butuh pengadaan ulang segera"
						icon={<AlertCircleIcon className="text-rose-500" />}
						loading={kpiLoading}
						value={kpi ? `${kpi.lowStockCount} SKU` : '0'}
						valueClassName="text-rose-600"
					/>
				</div>

				{/* Action & Filter Bar */}
				<CardSection title="Filter">
					<div className="flex flex-wrap gap-4 items-end">
						<div className="flex flex-col gap-1.5 flex-1 min-w-60">
							<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
								Pencarian Bahan
							</label>
							<div className="relative">
								<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
								<Input
									placeholder="Cari nama bahan atau SKU..."
									className="pl-9 h-10 bg-background border-muted/60"
									value={ds.search}
									onChange={(e) => ds.setSearch(e.target.value)}
								/>
							</div>
						</div>

						<div className="flex flex-col gap-1.5 min-w-50">
							<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
								Lokasi Gudang
							</label>
							<ComboboxStatic
								items={locationQry.data ?? []}
								value={locationId}
								onChange={setLocationId}
								placeholder="Semua Lokasi"
							/>
						</div>

						<div className="flex flex-col gap-1.5 min-w-70">
							<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
								Rentang Tanggal
							</label>
							<DateRangePickerV2
								value={range}
								onChange={setRange}
								placeholder="Pilih rentang tanggal"
							/>
						</div>
						<Button
							variant="outline"
							onClick={() => {
								ds.setSearch('')
								setLocationId(undefined)
								setRange({
									from: startOfDay(startOfMonth(new Date())),
									to: startOfDay(new Date()),
								})
							}}
						>
							Reset
						</Button>
					</div>
				</CardSection>

				{/* Dashboard Table */}
				<SectionErrorBoundary title="Ledger Inventori">
					<SummaryTable ds={ds} locationId={locationId} range={range} />
				</SectionErrorBoundary>
			</Page.Content>
		</Page>
	)
}

/* ─────────── Summary Table ─────────── */

const ch = createColumnHelper<StockLedgerSelectDto>()
const columnDefs = [
	ch.accessor('materialName', {
		header: 'Bahan Baku',
		size: 200,
	}),
	ch.accessor('baseUomCode', {
		header: 'Unit',
		cell: ({ getValue }) => (
			<Badge variant="outline" size="sm">
				{getValue()}
			</Badge>
		),
		size: 70,
	}),
	ch.accessor('openingQty', {
		header: 'Awal',
		cell: ({ getValue }) => <div className="font-medium tabular-nums">{Number(getValue())}</div>,
		size: 90,
	}),
	ch.display({
		id: 'masuk',
		header: 'Masuk',
		cell: ({ row }) => {
			const val =
				row.original.purchaseQty + row.original.transferInQty + row.original.productionInQty
			return val > 0 ? (
				<div className="flex items-center gap-1 text-emerald-600 font-medium tabular-nums">
					<MoveUpIcon />
					{val}
				</div>
			) : (
				<span className="text-muted-foreground/40">-</span>
			)
		},
		size: 90,
	}),
	ch.display({
		id: 'keluar',
		header: 'Keluar',
		cell: ({ row }) => {
			const val =
				row.original.sellQty +
				row.original.usageQty +
				row.original.transferOutQty +
				row.original.productionOutQty
			return val > 0 ? (
				<div className="flex items-center gap-1 text-rose-600 font-medium tabular-nums">
					<MoveDownIcon />
					{val}
				</div>
			) : (
				<span className="text-muted-foreground/40">-</span>
			)
		},
		size: 90,
	}),
	ch.accessor('closingAvgCost', currencyColumn({ header: 'HPP (Avg)', size: 130 })),
	ch.accessor('closingValue', currencyColumn({ header: 'Nilai Aset', size: 150 })),
]

function SummaryTable({
	ds,
	locationId,
	range,
}: {
	ds: ReturnType<typeof useDataTableState>
	locationId?: number
	range?: DateRange
}) {
	const { data, isLoading } = useQuery(
		// oxlint-disable-next-line typescript/no-unsafe-argument
		stockSummaryApi.ledger.query({
			...ds.pagination,
			q: ds.search ?? undefined,
			locationId: locationId ?? undefined,
			dateFrom: range?.from ?? startOfMonth(new Date()),
			dateTo: range?.to ?? new Date(),
		}),
	)

	const columns = useMemo(() => columnDefs, [])
	const table = useDataTable({
		columns,
		data: data?.data ?? [],
		pageCount: data?.meta.totalPages ?? 0,
		rowCount: data?.meta.total ?? 0,
		ds,
	})

	return (
		<DataTableCard
			title="Rincian Ledger Mutasi Bahan"
			table={table}
			isLoading={isLoading}
			recordCount={data?.meta.total ?? 0}
		/>
	)
}

/* ─────────── KPI Card ─────────── */

interface KpiCardProps {
	title: string
	description: string
	icon: React.ReactNode
	loading: boolean
	value: string | number
	valueClassName?: string
}

function KpiCard({ title, description, icon, loading, value, valueClassName }: KpiCardProps) {
	return (
		<Card className="shadow-sm overflow-hidden">
			<Card.Header className="flex flex-row items-center justify-between pb-2">
				<Card.Title className="text-sm font-semibold">{title}</Card.Title>
				{icon}
			</Card.Header>
			<Card.Content className="pt-4">
				{loading ? (
					<Skeleton className="h-8 w-24" />
				) : (
					<div className={cn('text-2xl font-bold', valueClassName)}>{value}</div>
				)}
				<p className="text-xs text-muted-foreground mt-1">{description}</p>
			</Card.Content>
		</Card>
	)
}

function cn(...classes: Array<string | undefined | false>) {
	return classes.filter(Boolean).join(' ')
}
