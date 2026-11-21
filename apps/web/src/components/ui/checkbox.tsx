'use client'

import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox'
import { CheckIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
	return (
		<CheckboxPrimitive.Root
			data-slot="checkbox"
			className={cn(
				'group/checkbox peer relative flex size-4 shrink-0 items-center justify-center rounded-lg outline-none group-has-disabled/field:opacity-50 focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 pointer-coarse:min-h-11 pointer-coarse:min-w-11',
				className,
			)}
			{...props}
		>
			<span className="pointer-events-none flex size-4 items-center justify-center rounded-lg border border-input transition-colors group-focus-visible/checkbox:border-ring group-aria-invalid/checkbox:border-destructive group-data-checked/checkbox:border-primary group-data-checked/checkbox:bg-primary group-data-checked/checkbox:text-primary-foreground dark:bg-input/30 dark:group-data-checked/checkbox:bg-primary">
				<CheckboxPrimitive.Indicator
					data-slot="checkbox-indicator"
					className="grid place-content-center text-current transition-none [&>svg]:size-3.5"
				>
					<CheckIcon />
				</CheckboxPrimitive.Indicator>
			</span>
		</CheckboxPrimitive.Root>
	)
}

export { Checkbox }
