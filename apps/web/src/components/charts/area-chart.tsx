import { Area, AreaChart as RechartsAreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from '@/components/ui/chart'

import { cn } from '@/lib/utils'

interface AreaChartProps {
	data: Record<string, unknown>[]
	config: ChartConfig
	xAxisKey: string
	dataKeys: string[]
	stacked?: boolean
	showGrid?: boolean
	showLegend?: boolean
	className?: string
}

export function AreaChart({
	data,
	config,
	xAxisKey,
	dataKeys,
	stacked = false,
	showGrid = true,
	showLegend = false,
	className,
}: AreaChartProps) {
	return (
		<ChartContainer config={config} className={cn('h-64 w-full', className)}>
			<RechartsAreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
				{showGrid && <CartesianGrid vertical={false} />}
				<XAxis
					dataKey={xAxisKey}
					tickLine={false}
					axisLine={false}
					tickMargin={8}
				/>
				<YAxis tickLine={false} axisLine={false} tickMargin={8} />
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
					/>
				))}
			</RechartsAreaChart>
		</ChartContainer>
	)
}
