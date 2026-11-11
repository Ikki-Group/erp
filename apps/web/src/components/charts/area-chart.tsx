import { Area, AreaChart as RechartsAreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { cn } from '@/lib/utils'

import {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from '@/components/ui/chart'

interface AreaChartProps {
	data: Record<string, unknown>[]
	config: ChartConfig
	xAxisKey: string
	dataKeys: string[]
	stacked?: boolean
	showGrid?: boolean
	showLegend?: boolean
	/** Formats Y-axis tick values (e.g. compact currency). Defaults to the raw number. */
	yAxisFormatter?: (value: number) => string
	/** Reserved width for Y-axis labels, in px. Widen when formatted ticks run long. */
	yAxisWidth?: number
	className?: string
	/** Name the measure and grouping; link an exact-value alternative with aria-describedby. */
	'aria-label'?: string
	'aria-describedby'?: string
}

export function AreaChart({
	data,
	config,
	xAxisKey,
	dataKeys,
	stacked = false,
	showGrid = true,
	showLegend = false,
	yAxisFormatter,
	yAxisWidth,
	className,
	'aria-label': ariaLabel = 'Area chart',
	'aria-describedby': ariaDescribedBy,
}: AreaChartProps) {
	return (
		<ChartContainer config={config} className={cn('h-64 w-full aspect-auto', className)}>
			<RechartsAreaChart
				data={data}
				aria-label={ariaLabel}
				aria-describedby={ariaDescribedBy}
				margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
			>
				{showGrid && <CartesianGrid vertical={false} />}
				<XAxis dataKey={xAxisKey} tickLine={false} axisLine={false} tickMargin={8} />
				<YAxis
					tickLine={false}
					axisLine={false}
					tickMargin={8}
					width={yAxisWidth}
					tickFormatter={yAxisFormatter}
				/>
				<ChartTooltip content={<ChartTooltipContent />} />
				{showLegend && <ChartLegend content={<ChartLegendContent />} />}
				{dataKeys.map((key) => (
					<Area
						key={key}
						type="monotone"
						dataKey={key}
						fill={`var(--color-${key})`}
						stroke={`var(--color-${key})`}
						fillOpacity={0.15}
						stackId={stacked ? 'stack' : undefined}
						animationDuration={400}
						animationEasing="ease-out"
					/>
				))}
			</RechartsAreaChart>
		</ChartContainer>
	)
}
