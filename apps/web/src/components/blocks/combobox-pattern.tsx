// oxlint-disable typescript/no-unsafe-member-access
// oxlint-disable typescript/no-unsafe-assignment
// oxlint-disable typescript/no-unsafe-argument

import { useQuery, type UnusedSkipTokenOptions } from '@tanstack/react-query'

import { Combobox as ComboboxPrimitive } from '@base-ui/react'
import { DatabaseIcon, Loader2Icon } from 'lucide-react'

import type { Option, StringOrNumber } from '@/lib/options'

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

export interface ComboboxBaseProps<
	TValue extends StringOrNumber,
	TData = any,
	TItem = Option<TValue, TData>,
> {
	value?: TValue
	onChange?: (value: TValue | undefined, item?: TItem) => void

	items?: Option<TValue, TData>[]
	isLoading?: boolean
	isDisabled?: boolean

	renderItem?: (item: TItem) => React.ReactNode
	renderValue?: (item: TItem | null) => React.ReactNode

	placeholder?: string
	emptyText?: string
	loadingText?: string
}

export function ComboboxBase<
	TValue extends StringOrNumber,
	TData = any,
	TItem = Option<TValue, TData>,
>({
	value,
	onChange,
	items = [],
	isLoading,
	isDisabled,

	renderItem,
	renderValue,

	placeholder = 'Pilih data...',
	emptyText = 'Data tidak ditemukan.',
	loadingText = 'Mencari data...',
}: ComboboxBaseProps<TValue, TData, TItem>) {
	const selectedItem =
		value !== undefined && value !== null ? (items.find((i) => i.value === value) ?? null) : null

	return (
		<Combobox
			items={items}
			value={selectedItem}
			onValueChange={(val) => {
				onChange?.(val?.value, val ? (val as TItem) : undefined)
			}}
			itemToStringLabel={(item) => item.label}
			isItemEqualToValue={(item, val) => item.value === val?.value}
			disabled={isDisabled}
		>
			<ComboboxTrigger
				render={<Button variant="outline" className="justify-between font-normal" />}
			>
				<ComboboxValue>
					{(selected) =>
						renderValue ? (
							renderValue((selected ?? null) as TItem | null)
						) : selected ? (
							<span>{selected.label}</span>
						) : (
							<span className="text-muted-foreground">{placeholder}</span>
						)
					}
				</ComboboxValue>
			</ComboboxTrigger>

			<ComboboxContent className="max-w-(--anchor-width) min-w-(--anchor-width)">
				<ComboboxInput showTrigger={false} placeholder="Search..." disabled={isDisabled} />
				<ComboboxPrimitive.Status>
					{isLoading ? <LoadingState text={loadingText} /> : null}
				</ComboboxPrimitive.Status>
				<ComboboxEmpty>
					<EmptyState text={emptyText} />
				</ComboboxEmpty>

				<ComboboxList>
					{(item) => {
						if (isLoading) return null
						return (
							<ComboboxItem key={String(item.value)} value={item}>
								{renderItem ? renderItem(item as TItem) : <span>{item.label}</span>}
							</ComboboxItem>
						)
					}}
				</ComboboxList>
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

export function ComboboxStatic<TValue extends StringOrNumber, TData = any>(
	props: ComboboxBaseProps<TValue, TData>,
) {
	return <ComboboxBase {...props} />
}

export interface ComboboxAsyncProps<TValue extends StringOrNumber, TData = any> extends Omit<
	ComboboxBaseProps<TValue, TData>,
	'items'
> {
	queryOptions: UnusedSkipTokenOptions<any, any, Option<TValue, TData>[], any>
}

export function ComboboxAsync<TValue extends StringOrNumber, TData = any>({
	queryOptions,
	...props
}: ComboboxAsyncProps<TValue, TData>) {
	const query = useQuery(queryOptions)

	return (
		<ComboboxBase
			{...props}
			items={query.data ?? []}
			isLoading={query.isLoading}
			isDisabled={query.isError}
		/>
	)
}
