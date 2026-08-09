import { useState } from 'react'

import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export interface FormDatePickerProps {
	label: string
	value?: Date
	onChange?: (date: Date | undefined) => void
	placeholder?: string
	error?: string
	description?: string
	disabled?: boolean
	className?: string
	/** Date format string (date-fns). Defaults to 'dd MMM yyyy'. */
	dateFormat?: string
}

export function FormDatePicker({
	label,
	value,
	onChange,
	placeholder = 'Pick a date',
	error,
	description,
	disabled,
	className,
	dateFormat = 'dd MMM yyyy',
}: FormDatePickerProps) {
	const [open, setOpen] = useState(false)
	const fieldId = label.toLowerCase().replace(/\s+/g, '-')

	return (
		<div className={cn('space-y-1.5', className)}>
			<Label htmlFor={fieldId}>{label}</Label>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger
					render={
						<Button
							id={fieldId}
							variant="outline"
							size="sm"
							disabled={disabled}
							aria-invalid={!!error}
							className={cn(
								'w-full justify-start text-left font-normal',
								!value && 'text-muted-foreground',
							)}
						/>
					}
				>
					<CalendarIcon className="mr-2 size-3.5" />
					{value ? format(value, dateFormat) : placeholder}
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0" align="start">
					<Calendar
						mode="single"
						selected={value}
						onSelect={(date) => {
							onChange?.(date)
							setOpen(false)
						}}
					/>
				</PopoverContent>
			</Popover>
			{description && !error && <p className="text-xs text-muted-foreground">{description}</p>}
			{error && (
				<p id={`${fieldId}-error`} className="text-xs text-destructive">
					{error}
				</p>
			)}
		</div>
	)
}
