'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

import { Input } from '@/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'

import type { UomDto } from '@/features/uom/dto/index'

/* -------------------------------------------------------------------------- */
/* NumberInputGroupAddon — numeric input with static UOM label                */
/* -------------------------------------------------------------------------- */

export interface NumberInputGroupAddonProps extends Omit<React.ComponentProps<'input'>, 'type'> {
	/** Static label displayed at the end (e.g., "kg", "pcs") */
	uomLabel: string
}

/**
 * Numeric input with a static UOM label at the end.
 * Use for simple quantity inputs where the UOM is fixed.
 */
export const NumberInputGroupAddon = React.forwardRef<HTMLInputElement, NumberInputGroupAddonProps>(
	({ className, uomLabel, disabled, ...props }, ref) => {
		return (
			<div
				data-slot="number-input-group-addon"
				data-disabled={disabled}
				className={cn(
					'group/input-group relative flex h-7 w-full pointer-coarse:min-h-10 min-w-0 items-center rounded-md border border-input bg-input/20 transition-colors outline-none has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-2 has-[[data-slot=input-group-control]:focus-visible]:ring-ring/30 has-[[data-slot][aria-invalid=true]]:border-destructive has-[[data-slot][aria-invalid=true]]:ring-2 has-[[data-slot][aria-invalid=true]]:ring-destructive/20 dark:bg-input/30 dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40',
					disabled && 'cursor-not-allowed opacity-50',
					className,
				)}
			>
				<Input
					ref={ref}
					type="number"
					data-slot="input-group-control"
					disabled={disabled}
					className={cn(
						'flex-1 rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent',
						'text-right font-mono tabular-nums',
						'px-2',
					)}
					{...props}
				/>
				<div
					data-slot="input-group-addon"
					data-align="inline-end"
					className={cn(
						'flex h-auto cursor-text items-center justify-center gap-1 py-2 text-xs/relaxed font-medium text-muted-foreground select-none order-last pr-2',
						disabled && 'opacity-50',
					)}
				>
					{uomLabel}
				</div>
			</div>
		)
	},
)

NumberInputGroupAddon.displayName = 'NumberInputGroupAddon'

/* -------------------------------------------------------------------------- */
/* NumberInputGroup — numeric input with editable UOM dropdown                 */
/* -------------------------------------------------------------------------- */

export interface NumberInputGroupProps extends Omit<
	React.ComponentProps<'input'>,
	'type' | 'onChange' | 'value'
> {
	/** Current numeric value */
	value: number | null | undefined
	/** Current UOM ID (selected from uomOptions) */
	uomId: number | null | undefined
	/** Available UOM options for the dropdown */
	uomOptions: Array<Pick<UomDto, 'id' | 'code'>>
	/** Called when the numeric value changes */
	onChange?: (value: number | null) => void
	/** Called when the UOM selection changes */
	onUomChange?: (uomId: number) => void
}

/**
 * Numeric input with an editable UOM dropdown at the end.
 * Use when the user needs to select both quantity and unit of measure.
 */
export const NumberInputGroup = React.forwardRef<HTMLInputElement, NumberInputGroupProps>(
	({ className, value, uomId, uomOptions, onChange, onUomChange, disabled, ...props }, ref) => {
		const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			const inputValue = e.target.value
			if (inputValue === '') {
				onChange?.(null)
			} else {
				const numValue = Number.parseFloat(inputValue)
				if (!Number.isNaN(numValue)) {
					onChange?.(numValue)
				}
			}
		}

		const handleUomChange = (selectedValue: string | null) => {
			if (selectedValue === null) return
			const id = Number.parseInt(selectedValue, 10)
			if (!Number.isNaN(id)) {
				onUomChange?.(id)
			}
		}

		return (
			<div
				data-slot="number-input-group"
				data-disabled={disabled}
				className={cn(
					'group/input-group relative flex h-7 w-full pointer-coarse:min-h-10 min-w-0 items-center rounded-md border border-input bg-input/20 transition-colors outline-none has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-2 has-[[data-slot=input-group-control]:focus-visible]:ring-ring/30 has-[[data-slot][aria-invalid=true]]:border-destructive has-[[data-slot][aria-invalid=true]]:ring-2 has-[[data-slot][aria-invalid=true]]:ring-destructive/20 dark:bg-input/30 dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40',
					disabled && 'cursor-not-allowed opacity-50',
					className,
				)}
			>
				<Input
					ref={ref}
					type="number"
					data-slot="input-group-control"
					value={value ?? ''}
					onChange={handleInputChange}
					disabled={disabled}
					className={cn(
						'flex-1 rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent',
						'text-right font-mono tabular-nums',
						'px-2',
					)}
					{...props}
				/>
				<Select value={uomId?.toString() ?? ''} onValueChange={handleUomChange} disabled={disabled}>
					<SelectTrigger
						data-slot="input-group-addon"
						size="sm"
						className={cn(
							'order-last h-6 rounded-none rounded-r-md border-0 bg-transparent px-2 shadow-none ring-0 focus-visible:ring-0 dark:bg-transparent',
							'data-placeholder:text-placeholder',
						)}
					>
						<SelectValue placeholder="UOM" />
					</SelectTrigger>
					<SelectContent>
						{uomOptions.map((uom) => (
							<SelectItem key={uom.id} value={uom.id.toString()}>
								{uom.code}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		)
	},
)

NumberInputGroup.displayName = 'NumberInputGroup'
