import { cn } from '@/lib/utils'

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'

export interface TableFilterOption {
	label: string
	value: string
}

interface TableFilterSelectBaseProps {
	options: readonly TableFilterOption[]
	allLabel?: string
	className?: string
}

interface SingleTableFilterSelectProps extends TableFilterSelectBaseProps {
	value?: string
	onValueChange: (value: string | undefined) => void
	multiple?: false
}

interface MultiTableFilterSelectProps extends TableFilterSelectBaseProps {
	value?: string[]
	onValueChange: (value: string[] | undefined) => void
	multiple: true
}

type TableFilterSelectProps = SingleTableFilterSelectProps | MultiTableFilterSelectProps

const ALL_VALUE = '__all__'

/**
 * Standardized filter dropdown for table toolbars. Renders a Select with a
 * consistent "All X" option that maps to an `undefined` filter value, so
 * every list page's filter reads and behaves the same way. Set
 * `multiple: true` for a checkbox-style multi-select (`value`/`onValueChange`
 * then deal in `string[]`).
 *
 * The trigger always resolves the selected value(s) to their option
 * label(s) via a `<SelectValue>` render function — Base UI's default value
 * display falls back to the raw value string when no `items`/children
 * mapping is given, so this must not be left to the default.
 *
 * Meant to be used via `TableToolbar`'s `filters` prop.
 */
export function TableFilterSelect({
	options,
	allLabel = 'All',
	className,
	...props
}: TableFilterSelectProps) {
	if (props.multiple) {
		const { value, onValueChange } = props
		const selected = value ?? []
		return (
			<Select
				multiple
				value={selected}
				onValueChange={(next: string[]) => onValueChange(next.length > 0 ? next : undefined)}
			>
				<SelectTrigger className={cn('w-[150px]', className)}>
					<SelectValue placeholder={allLabel}>
						{(val: string[] | null) => {
							const selectedValues = val ?? []
							if (selectedValues.length === 0) return allLabel
							const firstLabel =
								options.find((o) => o.value === selectedValues[0])?.label ?? selectedValues[0]
							return selectedValues.length === 1
								? firstLabel
								: `${firstLabel} +${selectedValues.length - 1}`
						}}
					</SelectValue>
				</SelectTrigger>
				<SelectContent>
					{options.map((opt) => (
						<SelectItem key={opt.value} value={opt.value}>
							{opt.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		)
	}

	const { value, onValueChange } = props

	return (
		<Select
			value={value ?? ALL_VALUE}
			onValueChange={(v: string | null) => onValueChange(!v || v === ALL_VALUE ? undefined : v)}
		>
			<SelectTrigger className={cn('w-[150px]', className)}>
				<SelectValue placeholder={allLabel}>
					{(val: string | null) => {
						if (!val || val === ALL_VALUE) return allLabel
						return options.find((o) => o.value === val)?.label ?? val
					}}
				</SelectValue>
			</SelectTrigger>
			<SelectContent>
				<SelectItem value={ALL_VALUE}>{allLabel}</SelectItem>
				{options.map((opt) => (
					<SelectItem key={opt.value} value={opt.value}>
						{opt.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	)
}
