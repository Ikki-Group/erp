import { useId } from 'react'

import { cn } from '@/lib/utils'

import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'

import { useFieldContext } from '../contexts.ts'
import { formatFieldError } from '../field-error.tsx'
import { idToString, toId } from '../transform.ts'

export interface IdSelectFieldOption {
	label: string
	value: number
}

export interface IdSelectFieldProps {
	id?: string
	label: string
	options: IdSelectFieldOption[]
	/** Adds a selectable option that clears this optional relation. Omit for a required relation. */
	nullableLabel?: string
	placeholder?: string
	description?: string
	disabled?: boolean
	className?: string
	/**
	 * Called in addition to the field's own `handleChange` — for cross-field
	 * side effects (e.g. auto-filling a related field's default when this one
	 * changes). Most fields don't need this; reach for `form.Subscribe`
	 * instead when the effect is read-only.
	 */
	onValueChange?: (value: number | null) => void
}

/**
 * Select for a foreign-key field whose DTO type is `number | null` — the
 * single most common field shape in this app's entity forms (`categoryId`,
 * `baseUomId`, `supplierId`, every `*LocationId`, ...). The field itself
 * holds the real numeric id; this component is the only place that
 * stringifies it for Base UI's `<Select>` and parses it back.
 *
 * For enum-like string fields (e.g. `type: 'raw' | 'semi_finished'`), use
 * `SelectField` instead — its value is the string itself, no conversion.
 */
export function IdSelectField({
	id,
	label,
	options,
	nullableLabel,
	placeholder = 'Select...',
	description,
	disabled,
	className,
	onValueChange,
}: IdSelectFieldProps) {
	const field = useFieldContext<number | null>()
	const generatedId = useId()
	const fieldId = id ?? generatedId
	const error = field.state.meta.isTouched ? formatFieldError(field.state.meta.errors) : undefined
	const describedBy =
		[description && `${fieldId}-description`, error && `${fieldId}-error`]
			.filter(Boolean)
			.join(' ') || undefined
	const selectedLabel =
		field.state.value === null
			? nullableLabel
			: options.find((option) => String(option.value) === idToString(field.state.value))?.label

	return (
		<div className={cn('space-y-1.5', className)}>
			<Label htmlFor={fieldId}>{label}</Label>
			<Select
				name={field.name}
				value={idToString(field.state.value)}
				onValueChange={(v: string | null) => {
					const id = toId(v ?? undefined)
					field.handleChange(id)
					onValueChange?.(id)
				}}
				disabled={disabled}
			>
				<SelectTrigger
					id={fieldId}
					className="w-full"
					onBlur={field.handleBlur}
					aria-invalid={!!error}
					aria-describedby={describedBy}
				>
					<span
						data-slot="select-value"
						className={cn('min-w-0 flex-1 text-left', !selectedLabel && 'text-muted-foreground')}
					>
						{selectedLabel ?? placeholder}
					</span>
				</SelectTrigger>
				<SelectContent>
					{nullableLabel && <SelectItem value="">{nullableLabel}</SelectItem>}
					{options.map((opt) => (
						<SelectItem key={opt.value} value={String(opt.value)}>
							{opt.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
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
