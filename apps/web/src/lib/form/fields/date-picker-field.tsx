import { useState } from 'react'

import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

import { formatFieldError } from '../field-error.tsx'
import { useFieldContext } from '../contexts.ts'

export interface DatePickerFieldProps {
	label: string
	placeholder?: string
	description?: string
	disabled?: boolean
	className?: string
	dateFormat?: string
	showDropdowns?: boolean
	fromYear?: number
	toYear?: number
}

export function DatePickerField({
	label,
	placeholder = 'Pick a date',
	description,
	disabled,
	className,
	dateFormat = 'dd MMM yyyy',
	showDropdowns = true,
	fromYear,
	toYear,
}: DatePickerFieldProps) {
	const field = useFieldContext<Date | undefined>()
	const fieldId = field.name
	const error = field.state.meta.isTouched
		? formatFieldError(field.state.meta.errors)
		: undefined

	const [open, setOpen] = useState(false)
	const currentYear = new Date().getFullYear()
	const startYear = fromYear ?? currentYear - 10
	const endYear = toYear ?? currentYear + 5
	const value = field.state.value

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
							field.handleChange(date)
							setOpen(false)
						}}
						captionLayout={showDropdowns ? 'dropdown' : 'label'}
						startMonth={new Date(startYear, 0)}
						endMonth={new Date(endYear, 11)}
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
