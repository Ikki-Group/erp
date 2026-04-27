import type { ComponentProps, ReactNode } from 'react'

import { SearchIcon, XIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'

import type { Option, StringOrNumber } from '@/types/common'

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface FilterBarProps extends ComponentProps<'div'> {
	/** Search value (controlled) */
	search?: string
	/** Search change callback */
	onSearchChange?: (value: string) => void
	/** Search input placeholder */
	searchPlaceholder?: string
	/** Extra filter/action nodes rendered after search */
	children?: ReactNode
	/** Show reset button when filters are active */
	onReset?: () => void
	/** Whether any filter is active (shows reset button) */
	hasActiveFilters?: boolean
}

/* -------------------------------------------------------------------------- */
/*  Main Component                                                            */
/* -------------------------------------------------------------------------- */

function FilterBar({
	search,
	onSearchChange,
	searchPlaceholder = 'Cari...',
	children,
	onReset,
	hasActiveFilters,
	className,
	...props
}: FilterBarProps) {
	const showReset = hasActiveFilters ?? (search != null && search.length > 0)

	return (
		<div className={cn('flex flex-wrap items-center gap-2', className)} {...props}>
			{onSearchChange && (
				<div className="relative">
					<SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
					<Input
						value={search ?? ''}
						onChange={(e) => onSearchChange(e.target.value)}
						placeholder={searchPlaceholder}
						className="h-8 w-[180px] lg:w-[240px] pl-8"
					/>
				</div>
			)}
			{children}
			{showReset && onReset && (
				<Button variant="ghost" size="sm" onClick={onReset} className="h-8">
					Reset
					<XIcon className="ml-1 size-3.5" />
				</Button>
			)}
		</div>
	)
}

/* -------------------------------------------------------------------------- */
/*  FilterSelect — reusable select filter                                     */
/* -------------------------------------------------------------------------- */

interface FilterSelectProps<TValue extends StringOrNumber> {
	value: TValue | undefined
	onValueChange: (value: TValue | undefined) => void
	options: Array<Option<TValue>>
	placeholder?: string
	className?: string
	/** Show "all" option to clear filter */
	allLabel?: string
}

function FilterSelect<TValue extends StringOrNumber>({
	value,
	onValueChange,
	options,
	placeholder = 'Filter...',
	className,
	allLabel = 'Semua',
}: FilterSelectProps<TValue>) {
	return (
		<Select
			value={value != null ? String(value) : '__all__'}
			onValueChange={(val) => {
				if (val === '__all__') {
					// @ts-expect-error
					onValueChange()
				} else {
					// Attempt to recover original type
					const numVal = Number(val)
					const typed = (Number.isNaN(numVal) ? val : numVal) as TValue
					onValueChange(typed)
				}
			}}
		>
			<SelectTrigger className={cn('h-8 w-[140px]', className)}>
				<SelectValue placeholder={placeholder} />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="__all__">{allLabel}</SelectItem>
				{options.map((opt) => (
					<SelectItem key={String(opt.value)} value={String(opt.value)}>
						{opt.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	)
}

/* -------------------------------------------------------------------------- */
/*  Compound                                                                  */
/* -------------------------------------------------------------------------- */

FilterBar.Select = FilterSelect

export { FilterBar, FilterSelect }
