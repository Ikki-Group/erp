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

interface FormComboboxOption {
	label: string
	value: string
}

interface FormComboboxProps {
	label: string
	options: FormComboboxOption[]
	value?: string
	onValueChange?: (value: string | null) => void
	placeholder?: string
	error?: string
	description?: string
	disabled?: boolean
	className?: string
}

export function FormCombobox({
	label,
	options,
	value,
	onValueChange,
	placeholder = 'Search...',
	error,
	description,
	disabled,
	className,
}: FormComboboxProps) {
	const fieldId = label.toLowerCase().replace(/\s+/g, '-')

	return (
		<div className={cn('space-y-1.5', className)}>
			<Label htmlFor={fieldId}>{label}</Label>
			<Combobox value={value} onValueChange={onValueChange} disabled={disabled}>
				<ComboboxInput placeholder={placeholder} disabled={disabled} aria-invalid={!!error} />
				<ComboboxContent>
					<ComboboxList>
						<ComboboxEmpty>No results found.</ComboboxEmpty>
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
