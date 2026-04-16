import { DatabaseIcon, Loader2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
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
import { Field } from '@/components/ui/field'

const countries = [
	{ code: 'af', label: 'Afghanistan' },
	{ code: 'al', label: 'Albania' },
	{ code: 'dz', label: 'Algeria' },
	{ code: 'as', label: 'American Samoa' },
	{ code: 'ad', label: 'Andorra' },
	{ code: 'ao', label: 'Angola' },
]

export function ComboboxExample() {
	return (
		<Field className="max-w-xs">
			<Combobox
				items={countries}
				defaultValue={countries[0]}
				itemToStringValue={(item: (typeof countries)[number]) => item.label}
			>
				<ComboboxTrigger
					render={<Button variant="outline" className="justify-between font-normal" />}
				>
					<ComboboxValue>
						{(item: (typeof countries)[number]) => (
							<span className="flex items-center gap-2">
								<img
									src={`https://flagcdn.com/${item.code.toLowerCase()}.svg`}
									alt=""
									width={16}
									height={16}
									className="rounded-xs"
								/>
								<span>{item.label}</span>
							</span>
						)}
					</ComboboxValue>
				</ComboboxTrigger>
				<ComboboxContent className="max-w-(--anchor-width) min-w-(--anchor-width)">
					<ComboboxInput showTrigger={false} placeholder="Search" />
					<ComboboxEmpty>No items found.</ComboboxEmpty>
					<ComboboxList>
						{(item) => (
							<ComboboxItem key={item.code} value={item}>
								<img
									src={`https://flagcdn.com/${item.code.toLowerCase()}.svg`}
									alt=""
									width={16}
									height={12}
									className="rounded-xs"
								/>
								{item.label}
							</ComboboxItem>
						)}
					</ComboboxList>
				</ComboboxContent>
			</Combobox>
		</Field>
	)
}

export interface BaseComboboxProps<T> {
	value?: T | null
	onChange?: (value: T | null) => void

	items?: T[]
	isLoading?: boolean
	isDisabled?: boolean

	getKey: (item: T) => string
	getLabel: (item: T) => string

	renderItem?: (item: T) => React.ReactNode
	renderValue?: (item: T | null) => React.ReactNode

	placeholder?: string
	emptyText?: string
	loadingText?: string
}

export function BaseCombobox<T>({
	value,
	onChange,
	items = [],
	isLoading,
	isDisabled,

	getKey,
	getLabel,

	renderItem,
	renderValue,

	placeholder = 'Select...',
	emptyText = 'No data',
	loadingText = 'Loading...',
}: BaseComboboxProps<T>) {
	return (
		<Combobox
			items={items}
			value={value ?? undefined}
			onValueChange={onChange}
			itemToStringValue={getLabel}
			disabled={isDisabled ?? isLoading}
		>
			<ComboboxTrigger
				render={<Button variant="outline" className="justify-between font-normal" />}
			>
				<ComboboxValue>
					{(selected) =>
						renderValue ? (
							renderValue(selected ?? null)
						) : selected ? (
							<span>{getLabel(selected)}</span>
						) : (
							<span className="text-muted-foreground">{placeholder}</span>
						)
					}
				</ComboboxValue>
			</ComboboxTrigger>

			<ComboboxContent className="max-w-(--anchor-width) min-w-(--anchor-width)">
				<ComboboxInput showTrigger={false} placeholder="Search..." disabled={isDisabled} />

				{isLoading ? (
					<div className="p-2 text-sm text-muted-foreground">{loadingText}</div>
				) : items.length === 0 ? (
					<ComboboxEmpty>{emptyText}</ComboboxEmpty>
				) : (
					<ComboboxList>
						{(item) => (
							<ComboboxItem key={getKey(item)} value={item}>
								{renderItem ? renderItem(item) : <span>{getLabel(item)}</span>}
							</ComboboxItem>
						)}
					</ComboboxList>
				)}
			</ComboboxContent>
		</Combobox>
	)
}

function LoadingState({ text }: { text: string }) {
	return (
		<div
			role="status"
			aria-live="polite"
			className="flex flex-col items-center justify-center p-6 text-muted-foreground gap-3"
		>
			<Loader2Icon className="size-5 animate-spin text-primary/60" aria-hidden="true" />
			<span className="text-sm font-medium">{text}</span>
		</div>
	)
}

function EmptyState({ text }: { text: string }) {
	return (
		<div
			role="status"
			aria-live="polite"
			className="flex flex-col items-center justify-center p-6 text-muted-foreground gap-3 text-center"
		>
			<DatabaseIcon className="size-8 opacity-20" aria-hidden="true" />
			<div className="flex flex-col gap-1">
				<span className="text-sm font-medium text-foreground">{text}</span>
				<span className="text-xs">Ubah kata kunci pencarian Anda</span>
			</div>
		</div>
	)
}
