import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { cn } from '@/lib/utils'

import {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from '@/components/ui/chart'

interface BarChartProps {
	data: Record<string, unknown>[]
	config: ChartConfig
	xAxisKey: string
	dataKeys: string[]
	stacked?: boolean
	horizontal?: boolean
	showGrid?: boolean
	showLegend?: boolean
	className?: string
	/** Name the measure and grouping; link an exact-value alternative with aria-describedby. */
	'aria-label'?: string
	'aria-describedby'?: string
}

export function BarChart({
	data,
	config,
	xAxisKey,
	dataKeys,
	stacked = false,
	horizontal = false,
	showGrid = true,
	showLegend = false,
	className,
	'aria-label': ariaLabel = 'Bar chart',
	'aria-describedby': ariaDescribedBy,
}: BarChartProps) {
	return (
		<ChartContainer config={config} className={cn('h-64 w-full aspect-auto', className)}>
			<RechartsBarChart
				data={data}
				aria-label={ariaLabel}
				aria-describedby={ariaDescribedBy}
				layout={horizontal ? 'vertical' : 'horizontal'}
				margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
			>
				{showGrid && <CartesianGrid vertical={false} />}
				{horizontal ? (
					<>
						<YAxis
							dataKey={xAxisKey}
							type="category"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
						/>
						<XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} />
					</>
				) : (
					<>
						<XAxis dataKey={xAxisKey} tickLine={false} axisLine={false} tickMargin={8} />
						<YAxis tickLine={false} axisLine={false} tickMargin={8} />
					</>
				)}
				<ChartTooltip content={<ChartTooltipContent />} />
				{showLegend && <ChartLegend content={<ChartLegendContent />} />}
				{dataKeys.map((key) => (
					<Bar
						key={key}
						dataKey={key}
						fill={`var(--color-${key})`}
						radius={[4, 4, 0, 0]}
						stackId={stacked ? 'stack' : undefined}
						animationDuration={400}
						animationEasing="ease-out"
					/>
				))}
			</RechartsBarChart>
		</ChartContainer>
	)
}
