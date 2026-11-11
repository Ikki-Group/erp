import { cn } from '@/lib/utils'

import { CardStat } from '@/components/blocks/card/card-stat'

import type { LucideIcon } from 'lucide-react'

interface ErpKpiCardProps {
	title: string
	value: string | number
	icon: LucideIcon
	description?: string
	trend?: 'up' | 'down' | 'neutral'
	trendValue?: string
	isLoading?: boolean
	className?: string
}

export function ErpKpiCard({
	title,
	value,
	icon: Icon,
	description,
	trend,
	trendValue,
	isLoading,
	className,
}: ErpKpiCardProps) {
	const trendColors = {
		up: 'text-emerald-600',
		down: 'text-rose-600',
		neutral: 'text-muted-foreground',
	}

	const displayDescription =
		trend && trendValue ? `${trendValue} ${description || ''}` : description

	return (
		<CardStat
			title={title}
			value={isLoading ? '...' : value}
			icon={Icon}
			description={displayDescription}
			isLoading={isLoading}
			className={trend ? cn(className, trendColors[trend]) : className}
		/>
	)
}
