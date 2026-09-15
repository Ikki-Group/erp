import { cn } from '@/lib/utils'

import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'

import { formatFieldError } from '../field-error.tsx'
import { idToString, toId } from '../transform.ts'
import { useFieldContext } from '../contexts.ts'

export interface IdSelectFieldOption {
	label: string
	value: number
}

export interface IdSelectFieldProps {
	label: string
	options: IdSelectFieldOption[]
	/** Shown as the first, unselectable-looking option when the field is optional. Omit for a required relation. */
	nullableLabel?: string
	placeholder?: string
	description?: string
	disabled?: boolean
	className?: string
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
	label,
	options,
	nullableLabel,
	placeholder = 'Select...',
	description,
	disabled,
	className,
}: IdSelectFieldProps) {
	const field = useFieldContext<number | null>()
	const fieldId = field.name
	const error = field.state.meta.isTouched
		? formatFieldError(field.state.meta.errors)
		: undefined

	return (
		<div className={cn('space-y-1.5', className)}>
			<Label htmlFor={fieldId}>{label}</Label>
			<Select
				value={idToString(field.state.value)}
				onValueChange={(v: string | null) => field.handleChange(toId(v ?? undefined))}
				disabled={disabled}
			>
				<SelectTrigger id={fieldId} className="w-full" aria-invalid={!!error}>
					<SelectValue placeholder={placeholder} />
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
			{description && !error && <p className="text-xs text-muted-foreground">{description}</p>}
			{error && (
				<p id={`${fieldId}-error`} className="text-xs text-destructive">
					{error}
				</p>
			)}
		</div>
	)
}
