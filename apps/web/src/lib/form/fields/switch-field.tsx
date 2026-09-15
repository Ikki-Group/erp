import { cn } from '@/lib/utils'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

import { useFieldContext } from '../contexts.ts'

export interface SwitchFieldProps {
	label: string
	description?: string
	disabled?: boolean
	className?: string
}

export function SwitchField({ label, description, disabled, className }: SwitchFieldProps) {
	const field = useFieldContext<boolean>()
	const fieldId = field.name

	return (
		<div className={cn('flex items-center justify-between gap-3', className)}>
			<div className="space-y-0.5">
				<Label htmlFor={fieldId}>{label}</Label>
				{description && <p className="text-xs text-muted-foreground">{description}</p>}
			</div>
			<Switch
				id={fieldId}
				checked={field.state.value ?? false}
				onCheckedChange={(checked) => field.handleChange(checked)}
				disabled={disabled}
			/>
		</div>
	)
}
