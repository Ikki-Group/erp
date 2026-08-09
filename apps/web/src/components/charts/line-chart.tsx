import { CartesianGrid, Line, LineChart as RechartsLineChart, XAxis, YAxis } from 'recharts'

import {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from '@/components/ui/chart'

import { cn } from '@/lib/utils'

interface LineChartProps {
	data: Record<string, unknown>[]
	config: ChartConfig
	xAxisKey: string
	dataKeys: string[]
	showGrid?: boolean
	showLegend?: boolean
	showDots?: boolean
	className?: string
}

export function LineChart({
	data,
	config,
	xAxisKey,
	dataKeys,
	showGrid = true,
	showLegend = false,
	showDots = true,
	className,
}: LineChartProps) {
	return (
		<ChartContainer config={config} className={cn('h-64 w-full', className)}>
			<RechartsLineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
				{showGrid && <CartesianGrid vertical={false} />}
				<XAxis dataKey={xAxisKey} tickLine={false} axisLine={false} tickMargin={8} />
				<YAxis tickLine={false} axisLine={false} tickMargin={8} />
				<ChartTooltip content={<ChartTooltipContent />} />
				{showLegend && <ChartLegend content={<ChartLegendContent />} />}
				{dataKeys.map((key) => (
					<Line
						key={key}
						type="monotone"
						dataKey={key}
						stroke={`var(--color-${key})`}
						strokeWidth={2}
						dot={showDots ? { r: 3, fill: `var(--color-${key})` } : false}
						activeDot={{ r: 5 }}
					/>
				))}
			</RechartsLineChart>
		</ChartContainer>
	)
}
