import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { BarChart3Icon, ShoppingBagIcon, TrendingUpIcon, UsersIcon } from 'lucide-react'

import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

import { toDateTimeStamp } from '@/lib/formatter'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { BadgeDot } from '@/components/blocks/data-display/badge-dot'
import { Page } from '@/components/layout/page'

import { Card } from '@/components/ui/card'

import { salesReportApi } from '@/features/reporting'

export const Route = createFileRoute('/_app/analytics/sales')({ component: AnalyticsSales })

function MetricCard({
	title,
	value,
	sub,
	icon: Icon,
	color,
}: {
	title: string
	value: string
	sub?: string
	icon: React.ElementType
	color: string
}) {
	return (
		<Card>
			<Card.Header className="flex flex-row items-center justify-between pb-2">
				<Card.Title className="text-sm font-medium text-muted-foreground">{title}</Card.Title>
				<Icon className={`h-4 w-4 ${color}`} />
			</Card.Header>
			<Card.Content>
				<div className="text-2xl font-bold font-mono tracking-tight">{value}</div>
				{sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
			</Card.Content>
		</Card>
	)
}

function AnalyticsSales() {
	const dateFrom = useMemo(() => new Date(new Date().setDate(1)), [])
	const dateTo = useMemo(() => new Date(), [])

	const { data: revenueData } = useQuery(
		salesReportApi.revenue.query({ dateFrom, dateTo, groupBy: 'day' }),
	)
	const { data: topProductsData, isLoading: isLoadingTopProducts } = useQuery(
		salesReportApi.topProducts.query({ dateFrom, dateTo }),
	)
	const { data: byLocationData, isLoading: isLoadingByLocation } = useQuery(
		salesReportApi.byLocation.query({ dateFrom, dateTo }),
	)
	const { data: byTypeData } = useQuery(salesReportApi.byType.query({ dateFrom, dateTo }))

	const revenue = revenueData?.data?.data ?? []
	const topProducts = topProductsData?.data?.data ?? []
	const byLocation = byLocationData?.data?.data ?? []
	const byType = byTypeData?.data?.data ?? []

	const totalRevenue = revenue.reduce((sum, r) => sum + Number(r.revenue), 0)
	const totalOrders = revenue.reduce((sum, r) => sum + r.orderCount, 0)

	const productDs = useDataTableState()
	const productTable = useDataTable({
		columns: [
			{ accessorKey: 'productName', header: 'Produk', size: 250 },
			{
				accessorKey: 'sku',
				header: 'SKU',
				size: 120,
				cell: ({ row }) => (
					<span className="font-mono text-xs text-muted-foreground">{row.original.sku}</span>
				),
			},
			{
				accessorKey: 'totalQuantity',
				header: 'Qty Terjual',
				size: 120,
				cell: ({ row }) => (
					<span className="font-medium tabular-nums">
						{row.original.totalQuantity.toLocaleString('id-ID')}
					</span>
				),
			},
			{
				accessorKey: 'totalRevenue',
				header: 'Revenue',
				size: 150,
				cell: ({ row }) => (
					<span className="font-medium text-right block tabular-nums">
						Rp {Number(row.original.totalRevenue).toLocaleString('id-ID')}
					</span>
				),
			},
		],
		data: topProducts,
		pageCount: 1,
		rowCount: topProducts.length,
		ds: productDs,
	})

	const locationDs = useDataTableState()
	const locationTable = useDataTable({
		columns: [
			{ accessorKey: 'locationName', header: 'Lokasi', size: 250 },
			{
				accessorKey: 'orderCount',
				header: 'Jumlah Order',
				size: 130,
				cell: ({ row }) => (
					<span className="font-medium tabular-nums">
						{row.original.orderCount.toLocaleString('id-ID')}
					</span>
				),
			},
			{
				accessorKey: 'revenue',
				header: 'Revenue',
				size: 150,
				cell: ({ row }) => (
					<span className="font-medium text-right block tabular-nums">
						Rp {Number(row.original.revenue).toLocaleString('id-ID')}
					</span>
				),
			},
		],
		data: byLocation,
		pageCount: 1,
		rowCount: byLocation.length,
		ds: locationDs,
	})

	return (
		<Page size="xl">
			<Page.BlockHeader
				title="Laporan Penjualan"
				description={`Periode ${toDateTimeStamp(dateFrom.toISOString()).split(',')[0]} - ${toDateTimeStamp(dateTo.toISOString()).split(',')[0]}`}
			/>
			<Page.Content className="flex flex-col gap-6">
				{/* Metric Cards */}
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<MetricCard
						title="Total Revenue"
						value={`Rp ${(totalRevenue / 1_000_000).toFixed(1)}M`}
						sub={`${revenue.length} data points`}
						icon={TrendingUpIcon}
						color="text-emerald-500"
					/>
					<MetricCard
						title="Total Order"
						value={totalOrders.toLocaleString('id-ID')}
						sub="Bulan ini"
						icon={ShoppingBagIcon}
						color="text-blue-500"
					/>
					<MetricCard
						title="Produk Terjual"
						value={topProducts.length.toString()}
						sub="Top produk unik"
						icon={BarChart3Icon}
						color="text-amber-500"
					/>
					<MetricCard
						title="Lokasi Aktif"
						value={byLocation.length.toString()}
						sub="Outlet bertransaksi"
						icon={UsersIcon}
						color="text-violet-500"
					/>
				</div>

				{/* Top Products */}
				<DataTableCard
					title="Produk Terlaris"
					table={productTable as any}
					isLoading={isLoadingTopProducts}
					recordCount={topProducts.length}
				/>

				{/* By Location */}
				<DataTableCard
					title="Penjualan per Lokasi"
					table={locationTable as any}
					isLoading={isLoadingByLocation}
					recordCount={byLocation.length}
				/>

				{/* Sales Type Breakdown */}
				<div className="grid gap-4 md:grid-cols-2">
					{byType.map((t) => (
						<Card key={t.salesTypeId}>
							<Card.Header className="pb-2">
								<Card.Title className="text-sm font-medium text-muted-foreground">
									{t.salesTypeName}
								</Card.Title>
							</Card.Header>
							<Card.Content>
								<div className="flex items-end justify-between">
									<div>
										<div className="text-xl font-bold font-mono tracking-tight">
											Rp {Number(t.revenue).toLocaleString('id-ID')}
										</div>
										<p className="text-xs text-muted-foreground mt-1">{t.orderCount} order</p>
									</div>
									<BadgeDot variant="primary-outline">{t.percentage}%</BadgeDot>
								</div>
							</Card.Content>
						</Card>
					))}
				</div>
			</Page.Content>
		</Page>
	)
}
