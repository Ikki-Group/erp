import { cn } from '@/lib/utils'

export interface ChartSwitchOption<T extends string = string> {
	value: T
	label: string
}

export interface ChartSwitchProps<T extends string = string> {
	options: ChartSwitchOption<T>[]
	value: T
	onChange: (value: T) => void
	className?: string
}

/**
 * Inline toggle for switching between chart types (e.g., Bar | Line).
 * Place in the top-right corner of a chart card header.
 */
export function ChartSwitch<T extends string = string>({
	options,
	value,
	onChange,
	className,
}: ChartSwitchProps<T>) {
	return (
		<div className={cn('inline-flex items-center rounded-md border bg-muted/30 p-0.5', className)}>
			{options.map((opt) => (
				<button
					key={opt.value}
					type="button"
					onClick={() => onChange(opt.value)}
					className={cn(
						'rounded-sm px-2 py-0.5 text-xs font-medium transition-colors',
						opt.value === value
							? 'bg-background text-foreground shadow-sm'
							: 'text-muted-foreground hover:text-foreground',
					)}
				>
					{opt.label}
				</button>
			))}
		</div>
	)
}
