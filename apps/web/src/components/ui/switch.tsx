'use client'

import { Switch as SwitchPrimitive } from '@base-ui/react/switch'

import { cn } from '@/lib/utils'

function Switch({
	className,
	size = 'default',
	...props
}: SwitchPrimitive.Root.Props & {
	size?: 'sm' | 'default'
}) {
	return (
		<SwitchPrimitive.Root
			data-slot="switch"
			data-size={size}
			className={cn(
				'peer group/switch relative inline-flex shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/30 aria-invalid:ring-2 aria-invalid:ring-destructive/20 data-[size=default]:h-[16.6px] data-[size=default]:w-7 data-[size=sm]:h-3.5 data-[size=sm]:w-6 dark:aria-invalid:ring-destructive/40 data-disabled:cursor-not-allowed data-disabled:opacity-50 pointer-coarse:min-h-11 pointer-coarse:min-w-11',
				className,
			)}
			{...props}
		>
			<span className="pointer-events-none inline-flex shrink-0 items-center rounded-full border border-transparent transition-colors group-data-[size=default]/switch:h-[16.6px] group-data-[size=default]/switch:w-7 group-data-[size=sm]/switch:h-3.5 group-data-[size=sm]/switch:w-6 group-focus-visible/switch:border-ring group-aria-invalid/switch:border-destructive group-data-checked/switch:bg-primary group-data-unchecked/switch:bg-input dark:group-data-unchecked/switch:bg-input/80">
				<SwitchPrimitive.Thumb
					data-slot="switch-thumb"
					className="pointer-events-none block rounded-full bg-background ring-0 transition-transform group-data-[size=default]/switch:size-3.5 group-data-[size=sm]/switch:size-3 group-data-[size=default]/switch:data-checked:translate-x-[calc(100%-2px)] group-data-[size=sm]/switch:data-checked:translate-x-[calc(100%-2px)] dark:data-checked:bg-primary-foreground group-data-[size=default]/switch:data-unchecked:translate-x-0 group-data-[size=sm]/switch:data-unchecked:translate-x-0 dark:data-unchecked:bg-foreground"
				/>
			</span>
		</SwitchPrimitive.Root>
	)
}

export { Switch }
