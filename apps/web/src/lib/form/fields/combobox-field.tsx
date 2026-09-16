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
	label: string
	options: ComboboxFieldOption[]
	placeholder?: string
	emptyMessage?: string
	description?: string
	disabled?: boolean
	className?: string
}

export function ComboboxField({
	label,
	options,
	placeholder = 'Search...',
	emptyMessage = 'No results found.',
	description,
	disabled,
	className,
}: ComboboxFieldProps) {
	const field = useFieldContext<string>()
	const fieldId = field.name
	const error = field.state.meta.isTouched ? formatFieldError(field.state.meta.errors) : undefined

	return (
		<div className={cn('space-y-1.5', className)}>
			<Label htmlFor={fieldId}>{label}</Label>
			<Combobox
				value={field.state.value || undefined}
				onValueChange={(v) => field.handleChange(v ?? '')}
				disabled={disabled}
			>
				<ComboboxInput placeholder={placeholder} disabled={disabled} aria-invalid={!!error} />
				<ComboboxContent>
					<ComboboxList>
						<ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
						{options.map((opt) => (
							<ComboboxItem key={opt.value} value={opt.value}>
								{opt.label}
							</ComboboxItem>
						))}
					</ComboboxList>
				</ComboboxContent>
			</Combobox>
			{description && !error && <p className="text-xs text-muted-foreground">{description}</p>}
			{error && (
				<p id={`${fieldId}-error`} className="text-xs text-destructive">
					{error}
				</p>
			)}
		</div>
	)
}
