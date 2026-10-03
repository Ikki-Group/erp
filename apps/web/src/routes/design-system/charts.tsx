import { useState } from 'react'

import { createFileRoute } from '@tanstack/react-router'

import { AreaChart } from '@/components/charts/area-chart'
import { BarChart } from '@/components/charts/bar-chart'
import { ChartSwitch } from '@/components/charts/chart-switch'
import { LineChart } from '@/components/charts/line-chart'
import { DataCard, PageHeader, PageSection } from '@/components/shared'

import type { ChartConfig } from '@/components/ui/chart'

export const Route = createFileRoute('/design-system/charts')({
	component: ChartsPage,
})

// -- Mock data --
const revenueData = [
	{ month: 'Jan', revenue: 28500000, orders: 820 },
	{ month: 'Feb', revenue: 31200000, orders: 910 },
	{ month: 'Mar', revenue: 29800000, orders: 875 },
	{ month: 'Apr', revenue: 35400000, orders: 1020 },
	{ month: 'May', revenue: 38900000, orders: 1150 },
	{ month: 'Jun', revenue: 42800000, orders: 1284 },
]

const categoryData = [
	{ category: 'Coffee', sales: 4200 },
	{ category: 'Tea', sales: 2100 },
	{ category: 'Pastry', sales: 1800 },
	{ category: 'Snack', sales: 900 },
	{ category: 'Juice', sales: 1500 },
]

const stockData = [
	{ month: 'Jan', rawMaterial: 150, packaging: 400, dairy: 80 },
	{ month: 'Feb', rawMaterial: 140, packaging: 380, dairy: 75 },
	{ month: 'Mar', rawMaterial: 160, packaging: 420, dairy: 90 },
	{ month: 'Apr', rawMaterial: 135, packaging: 350, dairy: 70 },
	{ month: 'May', rawMaterial: 155, packaging: 410, dairy: 85 },
	{ month: 'Jun', rawMaterial: 145, packaging: 390, dairy: 78 },
]

const revenueChartConfig: ChartConfig = {
	revenue: { label: 'Revenue', color: 'var(--primary)' },
	orders: { label: 'Orders', color: 'var(--chart-2)' },
}

/** Compact Rp axis label (e.g. "Rp 42jt") -- full precision stays in the tooltip. */
function formatCompactRupiah(value: number): string {
	if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(0)}jt`
	if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}rb`
	return `Rp ${value}`
}

const categoryChartConfig: ChartConfig = {
	sales: { label: 'Sales', color: 'var(--primary)' },
}

const stockChartConfig: ChartConfig = {
	rawMaterial: { label: 'Raw Material', color: 'var(--primary)' },
	packaging: { label: 'Packaging', color: 'var(--chart-2)' },
	dairy: { label: 'Dairy', color: 'var(--chart-3)' },
}

function ChartsPage() {
	return (
		<div className="space-y-10">
			<PageHeader title="Charts" description="Data visualization components, built on Recharts." />

			<PageSection title="Charts" description="Area, line, bar, and stacked-area variants.">
				<div className="grid gap-6 lg:grid-cols-2">
					<DataCard title="Revenue Trend" description="Monthly revenue over time.">
						<AreaChart
							data={revenueData}
							config={revenueChartConfig}
							xAxisKey="month"
							dataKeys={['revenue']}
							yAxisFormatter={formatCompactRupiah}
							yAxisWidth={56}
						/>
					</DataCard>
					<DataCard title="Orders" description="Monthly order count.">
						<LineChart
							data={revenueData}
							config={revenueChartConfig}
							xAxisKey="month"
							dataKeys={['orders']}
							showDots={true}
						/>
					</DataCard>
					<DataCard title="Sales by Category" description="Top selling categories.">
						<BarChart
							data={categoryData}
							config={categoryChartConfig}
							xAxisKey="category"
							dataKeys={['sales']}
						/>
					</DataCard>
					<DataCard title="Stock Levels" description="Stock by material type (stacked).">
						<AreaChart
							data={stockData}
							config={stockChartConfig}
							xAxisKey="month"
							dataKeys={['rawMaterial', 'packaging', 'dairy']}
							stacked={true}
							showLegend={true}
						/>
					</DataCard>
				</div>
			</PageSection>

			<PageSection title="Chart Switch" description="Toggle between chart types within a card.">
				<ChartSwitchDemo />
			</PageSection>
		</div>
	)
}

function ChartSwitchDemo() {
	const [chartType, setChartType] = useState<'bar' | 'line'>('bar')

	return (
		<DataCard
			title="Sales Overview"
			description="Switch between chart types."
			actions={
				<ChartSwitch
					options={[
						{ value: 'bar', label: 'Bar' },
						{ value: 'line', label: 'Line' },
					]}
					value={chartType}
					onChange={setChartType}
				/>
			}
		>
			{chartType === 'bar' ? (
				<BarChart
					data={categoryData}
					config={categoryChartConfig}
					xAxisKey="category"
					dataKeys={['sales']}
					className="h-48"
				/>
			) : (
				<LineChart
					data={revenueData}
					config={revenueChartConfig}
					xAxisKey="month"
					dataKeys={['orders']}
					className="h-48"
				/>
			)}
		</DataCard>
	)
}
