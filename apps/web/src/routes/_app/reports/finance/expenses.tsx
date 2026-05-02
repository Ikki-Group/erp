import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { Cell, Pie, PieChart } from 'recharts'

import { CardStat } from '@/components/blocks/card/card-stat'
import { ChartCard, ChartGrid } from '@/components/blocks/data-display/chart-card'
import { Page } from '@/components/layout/page'

import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	ChartLegend,
	ChartLegendContent,
} from '@/components/ui/chart'
import { Card } from '@/components/ui/card'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'

import { financeReportApi } from '@/features/reporting'
import type { FinanceReportRequestDto, ExpenditureByCategoryDto } from '@/features/reporting'
import { ReportDateFilter, useReportDateRange } from '@/features/reporting/components'

import { DollarSignIcon } from 'lucide-react'

export const Route = createFileRoute('/_app/reports/finance/expenses')({
	component: FinanceExpensesReport,
})

const COLORS = [
	'oklch(var(--chart-1))',
	'oklch(var(--chart-2))',
	'oklch(var(--chart-3))',
	'oklch(var(--chart-4))',
	'oklch(var(--chart-5))',
]

const chartConfig = { totalAmount: { label: 'Total', color: 'oklch(var(--chart-1))' } }

function FinanceExpensesReport() {
	const [filter, setFilter] = useReportDateRange()

	const { data } = useQuery(
		financeReportApi.expenditureByCategory.query(filter as FinanceReportRequestDto),
	)

	const categories: ExpenditureByCategoryDto[] = data?.data?.data ?? []
	const summary = data?.data?.summary
	const totalAmount = Number(summary?.total ?? 0)

	return (
		<Page>
			<Page.BlockHeader
				title="Laporan Pengeluaran"
				description="Analisis pengeluaran berdasarkan kategori."
			/>
			<Page.Content className="space-y-6">
				<Card>
					<Card.Content className="pt-6">
						<ReportDateFilter value={filter} onChange={setFilter} showGroupBy={false} />
					</Card.Content>
				</Card>

				<div className="grid gap-4 md:grid-cols-1">
					<CardStat
						title="Total Pengeluaran"
						value={`Rp ${totalAmount.toLocaleString('id-ID')}`}
						icon={DollarSignIcon}
					/>
				</div>

				<ChartGrid className="grid-cols-1 lg:grid-cols-2">
					<ChartCard title="Distribusi per Kategori" description="Proporsi pengeluaran">
						<ChartContainer config={chartConfig} className="aspect-auto h-80 w-full">
							<PieChart>
								<ChartTooltip content={<ChartTooltipContent hideLabel />} />
								<Pie
									data={categories}
									dataKey="totalAmount"
									nameKey="categoryName"
									innerRadius={60}
									outerRadius={100}
								>
									{categories.map((_, i) => (
										<Cell key={i} fill={COLORS[i % COLORS.length]} />
									))}
								</Pie>
								<ChartLegend content={<ChartLegendContent nameKey="categoryName" />} />
							</PieChart>
						</ChartContainer>
					</ChartCard>

					<ChartCard title="Detail Kategori" description="Rincian per kategori">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Kategori</TableHead>
									<TableHead className="text-right">Total</TableHead>
									<TableHead className="text-right">%</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{categories.map((cat) => (
									<TableRow key={cat.categoryId}>
										<TableCell className="font-medium">{cat.categoryName}</TableCell>
										<TableCell className="text-right font-mono">
											Rp {Number(cat.totalAmount).toLocaleString('id-ID')}
										</TableCell>
										<TableCell className="text-right text-muted-foreground">
											{Number(cat.percentage).toFixed(1)}%
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</ChartCard>
				</ChartGrid>
			</Page.Content>
		</Page>
	)
}
