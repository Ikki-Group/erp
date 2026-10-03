import { cn } from '@/lib/utils'

import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
	ComboboxTrigger,
	ComboboxValue,
} from '@/components/ui/combobox'

export interface TableFilterComboboxOption {
	label: string
	value: string
}

interface TableFilterComboboxProps {
	options: readonly TableFilterComboboxOption[]
	value?: string[]
	onValueChange: (value: string[] | undefined) => void
	placeholder?: string
	emptyMessage?: string
	className?: string
}

/**
 * Searchable multi-select filter for `TableToolbar` — a closed trigger
 * button (same shape as `TableFilterSelect`) that opens a popup with a
 * search input on top and a checkable list below ("input inside popup",
 * Base UI's recommended shape for a searchable select — see the Combobox
 * docs). Reach for `TableFilterSelect` (`multiple`) instead for short fixed
 * lists (a handful of statuses/categories), where a plain checklist is
 * faster to scan than typing. Wired in via `TableFilterDef`'s
 * `searchable: true` — see `docs/web/07-design-system.md`.
 *
 * Deliberately does *not* show its own chips for the current selection —
 * `TableToolbar` already renders one merged, removable chip per active
 * filter below the toolbar row. Showing selections a second time inside the
 * trigger (as removable chips) duplicated that and forced the trigger to
 * grow/wrap independently of its sibling filter buttons.
 *
 * The `items` prop (object items shaped `{ label, value }`) is what gives
 * Base UI's Combobox its built-in type-to-filter behavior — it auto-detects
 * `.label` for matching/display and `.value` for identity. Without `items`
 * (just static `<ComboboxItem>` children), there is nothing for the
 * component to filter and typing does nothing.
 */
export function TableFilterCombobox({
	options,
	value,
	onValueChange,
	placeholder = 'Filter...',
	emptyMessage = 'No results found.',
	className,
}: TableFilterComboboxProps) {
	const selected = value ?? []
	const selectedOptions = options.filter((o) => selected.includes(o.value))

	return (
		<Combobox
			items={options}
			multiple
			value={selectedOptions}
			onValueChange={(next: TableFilterComboboxOption[]) => {
				const values = next.map((o) => o.value)
				onValueChange(values.length > 0 ? values : undefined)
			}}
			isItemEqualToValue={(a: TableFilterComboboxOption, b: TableFilterComboboxOption) =>
				a.value === b.value
			}
		>
			<ComboboxTrigger
				className={cn(
					'flex h-7 w-37.5 items-center justify-between gap-1.5 rounded-md border border-input bg-input/20 px-2 text-xs/relaxed whitespace-nowrap outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30 dark:hover:bg-input/50',
					className,
				)}
			>
				<ComboboxValue>
					{(vals: TableFilterComboboxOption[]) => {
						if (vals.length === 0) {
							return <span className="truncate text-muted-foreground">{placeholder}</span>
						}
						const [first, ...rest] = vals
						return (
							<span className="truncate">
								{first?.label}
								{rest.length > 0 && ` +${rest.length}`}
							</span>
						)
					}}
				</ComboboxValue>
			</ComboboxTrigger>
			<ComboboxContent>
				<ComboboxInput placeholder={placeholder} showTrigger={false} />
				<ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
				<ComboboxList>
					{(opt: TableFilterComboboxOption) => (
						<ComboboxItem key={opt.value} value={opt}>
							{opt.label}
						</ComboboxItem>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	)
}
