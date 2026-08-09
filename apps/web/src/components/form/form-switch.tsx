import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

import { cn } from '@/lib/utils'

interface FormSwitchProps {
	label: string
	description?: string
	checked?: boolean
	onCheckedChange?: (checked: boolean) => void
	disabled?: boolean
	className?: string
}

export function FormSwitch({
	label,
	description,
	checked,
	onCheckedChange,
	disabled,
	className,
}: FormSwitchProps) {
	const fieldId = label.toLowerCase().replace(/\s+/g, '-')

	return (
		<div className={cn('flex items-center justify-between gap-3', className)}>
			<div className="space-y-0.5">
				<Label htmlFor={fieldId}>{label}</Label>
				{description && <p className="text-xs text-muted-foreground">{description}</p>}
			</div>
			<Switch
				id={fieldId}
				checked={checked}
				onCheckedChange={onCheckedChange}
				disabled={disabled}
			/>
		</div>
	)
}
