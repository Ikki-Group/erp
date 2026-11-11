import { Radio as RadioPrimitive } from '@base-ui/react/radio'
import { RadioGroup as RadioGroupPrimitive } from '@base-ui/react/radio-group'

import { cn } from '@/lib/utils'

function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props) {
	return (
		<RadioGroupPrimitive
			data-slot="radio-group"
			className={cn('grid w-full gap-3', className)}
			{...props}
		/>
	)
}

function RadioGroupItem({ className, ...props }: RadioPrimitive.Root.Props) {
	return (
		<RadioPrimitive.Root
			data-slot="radio-group-item"
			className={cn(
				'group/radio-group-item peer relative flex aspect-square size-4 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 pointer-coarse:min-h-11 pointer-coarse:min-w-11',
				className,
			)}
			{...props}
		>
			<span className="pointer-events-none flex size-4 items-center justify-center rounded-full border border-input group-focus-visible/radio-group-item:border-ring group-aria-invalid/radio-group-item:border-destructive group-data-checked/radio-group-item:border-primary group-data-checked/radio-group-item:bg-primary dark:bg-input/30 dark:group-data-checked/radio-group-item:bg-primary">
				<RadioPrimitive.Indicator
					data-slot="radio-group-indicator"
					className="flex items-center justify-center"
				>
					<span className="size-2 rounded-full bg-primary-foreground" />
				</RadioPrimitive.Indicator>
			</span>
		</RadioPrimitive.Root>
	)
}

export { RadioGroup, RadioGroupItem }
