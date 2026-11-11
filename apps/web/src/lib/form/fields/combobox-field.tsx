import { useId } from 'react'

import { cn } from '@/lib/utils'

import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from '@/components/ui/combobox'
import { Label } from '@/components/ui/label'

import { useFieldContext } from '../contexts.ts'
import { formatFieldError } from '../field-error.tsx'

export interface ComboboxFieldOption {
	label: string
	value: string
}

export interface ComboboxFieldProps {
	id?: string
	label: string
	options: ComboboxFieldOption[]
	placeholder?: string
	emptyMessage?: string
	description?: string
	disabled?: boolean
	className?: string
}

export function ComboboxField({
	id,
	label,
	options,
	placeholder = 'Search...',
	emptyMessage = 'No results found.',
	description,
	disabled,
	className,
}: ComboboxFieldProps) {
	const field = useFieldContext<string>()
	const generatedId = useId()
	const fieldId = id ?? generatedId
	const error = field.state.meta.isTouched ? formatFieldError(field.state.meta.errors) : undefined
	const describedBy =
		[description && `${fieldId}-description`, error && `${fieldId}-error`]
			.filter(Boolean)
			.join(' ') || undefined
	const selectedOption = options.find((opt) => opt.value === field.state.value)

	return (
		<div className={cn('space-y-1.5', className)}>
			<Label htmlFor={fieldId}>{label}</Label>
			<Combobox
				name={field.name}
				items={options}
				value={selectedOption ?? null}
				onValueChange={(opt: ComboboxFieldOption | null) => field.handleChange(opt?.value ?? '')}
				isItemEqualToValue={(a: ComboboxFieldOption, b: ComboboxFieldOption) => a.value === b.value}
				disabled={disabled}
			>
				<ComboboxInput
					id={fieldId}
					placeholder={placeholder}
					disabled={disabled}
					onBlur={field.handleBlur}
					aria-invalid={!!error}
					aria-describedby={describedBy}
				/>
				<ComboboxContent>
					<ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
					<ComboboxList>
						{(opt: ComboboxFieldOption) => (
							<ComboboxItem key={opt.value} value={opt}>
								{opt.label}
							</ComboboxItem>
						)}
					</ComboboxList>
				</ComboboxContent>
			</Combobox>
			{description && (
				<p id={`${fieldId}-description`} className="text-xs text-muted-foreground">
					{description}
				</p>
			)}
			{error && (
				<p id={`${fieldId}-error`} className="text-xs text-destructive">
					{error}
				</p>
			)}
		</div>
	)
}
