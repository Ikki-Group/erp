import { useState } from 'react'
import { subDays, subMonths, startOfWeek, startOfMonth, format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

import { cn } from '@/lib/utils'

export interface DateRange {
	from: Date
	to: Date
}

interface Preset {
	label: string
	getValue: () => DateRange
}

const createPresets = (): Preset[] => {
	const today = new Date()
	return [
		{
			label: 'Today',
			getValue: () => ({ from: today, to: today }),
		},
		{
			label: 'Last 7 days',
			getValue: () => ({ from: subDays(today, 6), to: today }),
		},
		{
			label: 'This week',
			getValue: () => ({ from: startOfWeek(today, { weekStartsOn: 1 }), to: today }),
		},
		{
			label: 'Last 30 days',
			getValue: () => ({ from: subDays(today, 29), to: today }),
		},
		{
			label: 'This month',
			getValue: () => ({ from: startOfMonth(today), to: today }),
		},
		{
			label: 'Last 3 months',
			getValue: () => ({ from: subMonths(today, 3), to: today }),
		},
		{
			label: 'Last 6 months',
			getValue: () => ({ from: subMonths(today, 6), to: today }),
		},
	]
}

interface DateRangeFilterProps {
	value?: DateRange
	onChange?: (range: DateRange | undefined) => void
	placeholder?: string
	className?: string
}

export function DateRangeFilter({
	value,
	onChange,
	placeholder = 'Select date range',
	className,
}: DateRangeFilterProps) {
	const [open, setOpen] = useState(false)
	const presets = createPresets()

	const displayValue = value
		? `${format(value.from, 'dd MMM yyyy')} – ${format(value.to, 'dd MMM yyyy')}`
		: null

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger
				render={
					<Button
						variant="outline"
						size="sm"
						className={cn(
							'justify-start text-left font-normal',
							!value && 'text-muted-foreground',
							className,
						)}
					/>
				}
			>
				<CalendarIcon className="mr-1.5 size-3.5" />
				<span className="truncate">{displayValue ?? placeholder}</span>
			</PopoverTrigger>
			<PopoverContent className="flex w-auto flex-col p-0 sm:flex-row" align="start">
				{/* Presets sidebar */}
				<div className="flex flex-row gap-1 border-b p-2 sm:flex-col sm:border-b-0 sm:border-r">
					<div className="flex flex-row flex-wrap gap-1 sm:flex-col sm:flex-nowrap">
						{presets.map((preset) => (
							<Button
								key={preset.label}
								variant="ghost"
								size="sm"
								className="justify-start text-xs"
								onClick={() => {
									onChange?.(preset.getValue())
									setOpen(false)
								}}
							>
								{preset.label}
							</Button>
						))}
					</div>
					{value && (
						<Button
							variant="ghost"
							size="sm"
							className="justify-start text-xs text-muted-foreground"
							onClick={() => {
								onChange?.(undefined)
								setOpen(false)
							}}
						>
							Clear
						</Button>
					)}
				</div>
				{/* Calendar */}
				<div className="p-2">
					<Calendar
						mode="range"
						selected={value ? { from: value.from, to: value.to } : undefined}
						onSelect={(range) => {
							if (range?.from && range?.to) {
								onChange?.({ from: range.from, to: range.to })
								setOpen(false)
							} else if (range?.from) {
								// Partial selection — keep popover open
								onChange?.({ from: range.from, to: range.from })
							}
						}}
						numberOfMonths={2}
					/>
				</div>
			</PopoverContent>
		</Popover>
	)
}
