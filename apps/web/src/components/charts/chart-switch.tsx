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
	'aria-label'?: string
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
	'aria-label': ariaLabel = 'Chart type',
}: ChartSwitchProps<T>) {
	return (
		<div
			role="group"
			aria-label={ariaLabel}
			className={cn('inline-flex items-center rounded-md border bg-muted/30 p-0.5', className)}
		>
			{options.map((opt) => (
				<button
					key={opt.value}
					type="button"
					aria-pressed={opt.value === value}
					onClick={() => onChange(opt.value)}
					className={cn(
						'rounded-sm px-2 py-0.5 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 pointer-coarse:min-h-11 pointer-coarse:min-w-11',
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
