import { useMemo, useState } from 'react'

import {
	endOfMonth,
	endOfYear,
	format,
	startOfDay,
	startOfMonth,
	startOfYear,
	subDays,
	subMonths,
	subYears,
} from 'date-fns'
import { CalendarIcon, XIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'

import type { DateRange } from 'react-day-picker'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DatePreset {
	label: string
	range: () => DateRange
}

export interface DateRangePickerV2Props {
	/** Controlled value */
	value?: DateRange
	/** Callback when the user applies a range */
	onChange?: (range: DateRange | undefined) => void
	/** Button placeholder text */
	placeholder?: string
	/** Disable the trigger */
	disabled?: boolean
	/** Disable dates after this date (defaults to today) */
	disableFuture?: boolean
	/** Additional trigger className */
	className?: string
	/** Custom presets (overrides defaults) */
	presets?: DatePreset[]
	/** Popover alignment */
	align?: 'start' | 'center' | 'end'
}

// ─── Default Presets ──────────────────────────────────────────────────────────
// All presets use factory functions so `today` is always fresh.

const DEFAULT_PRESETS: DatePreset[] = [
	{
		label: 'Hari ini',
		range: () => {
			const d = startOfDay(new Date())
			return { from: d, to: d }
		},
	},
	{
		label: 'Kemarin',
		range: () => {
			const d = startOfDay(subDays(new Date(), 1))
			return { from: d, to: d }
		},
	},
	{
		label: '7 hari terakhir',
		range: () => ({
			from: startOfDay(subDays(new Date(), 6)),
			to: startOfDay(new Date()),
		}),
	},
	{
		label: '30 hari terakhir',
		range: () => ({
			from: startOfDay(subDays(new Date(), 29)),
			to: startOfDay(new Date()),
		}),
	},
	{
		label: 'Bulan ini',
		range: () => ({
			from: startOfDay(startOfMonth(new Date())),
			to: startOfDay(new Date()),
		}),
	},
	{
		label: 'Bulan lalu',
		range: () => {
			const prev = subMonths(new Date(), 1)
			return {
				from: startOfDay(startOfMonth(prev)),
				to: startOfDay(endOfMonth(prev)),
			}
		},
	},
	{
		label: 'Tahun ini',
		range: () => ({
			from: startOfDay(startOfYear(new Date())),
			to: startOfDay(new Date()),
		}),
	},
	{
		label: 'Tahun lalu',
		range: () => {
			const prev = subYears(new Date(), 1)
			return {
				from: startOfDay(startOfYear(prev)),
				to: startOfDay(endOfYear(prev)),
			}
		},
	},
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRange(range: DateRange | undefined): string {
	if (!range?.from) return ''
	if (!range.to || range.from.toDateString() === range.to.toDateString())
		return format(range.from, 'dd MMM yyyy')
	return `${format(range.from, 'dd MMM yyyy')} – ${format(range.to, 'dd MMM yyyy')}`
}

function rangesEqual(a: DateRange | undefined, b: DateRange | undefined): boolean {
	if (!a?.from || !b?.from) return false
	if (!a.to || !b.to) return false
	return (
		a.from.toDateString() === b.from.toDateString() && a.to.toDateString() === b.to.toDateString()
	)
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DateRangePickerV2({
	value,
	onChange,
	placeholder = 'Pilih rentang tanggal',
	disabled = false,
	disableFuture = true,
	className,
	presets = DEFAULT_PRESETS,
	align = 'start',
}: DateRangePickerV2Props) {
	const [open, setOpen] = useState(false)
	const [draft, setDraft] = useState<DateRange | undefined>(value)
	const [month, setMonth] = useState(() => value?.from ?? new Date())

	// Sync draft ← value when popover opens
	const handleOpenChange = (nextOpen: boolean) => {
		if (nextOpen) {
			setDraft(value)
			setMonth(value?.from ?? new Date())
		}
		setOpen(nextOpen)
	}

	const handlePresetClick = (preset: DatePreset) => {
		const range = preset.range()
		setDraft(range)
		setMonth(range.to ?? range.from ?? new Date())
	}

	const handleApply = () => {
		onChange?.(draft)
		setOpen(false)
	}

	const handleCancel = () => {
		setDraft(value)
		setOpen(false)
	}

	const handleClear = (e: React.MouseEvent) => {
		e.stopPropagation()
		// oxlint-disable-next-line unicorn/no-useless-undefined
		onChange?.(undefined)
	}

	const today = useMemo(() => startOfDay(new Date()), [])
	const hasValue = Boolean(value?.from)

	// Find which preset matches the current draft (for active state)
	const activePresetLabel = useMemo(() => {
		if (!draft?.from) return null
		return presets.find((p) => rangesEqual(p.range(), draft))?.label ?? null
	}, [draft, presets])

	return (
		<Popover open={open} onOpenChange={handleOpenChange}>
			<PopoverTrigger
				render={
					<Button
						variant="outline"
						disabled={disabled}
						data-empty={!hasValue}
						className={cn(
							'w-full justify-start gap-2 text-left font-normal',
							'data-[empty=true]:text-muted-foreground',
							className,
						)}
					/>
				}
			>
				<CalendarIcon className="size-4 shrink-0 opacity-50" />
				<span className="flex-1 truncate">{hasValue ? formatRange(value) : placeholder}</span>
				{hasValue && (
					<span
						role="button"
						tabIndex={0}
						aria-label="Hapus pilihan"
						onClick={handleClear}
						onKeyDown={(e) => e.key === 'Enter' && handleClear(e as unknown as React.MouseEvent)}
						className={cn(
							'ml-auto flex size-5 shrink-0 items-center justify-center rounded-full',
							'text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
						)}
					>
						<XIcon className="size-3" />
					</span>
				)}
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align={align} sideOffset={8}>
				<div className="flex flex-col">
					{/* Main: Presets + Calendar */}
					<div className="flex max-sm:flex-col">
						{/* Preset sidebar */}
						<div className="max-sm:order-1 max-sm:border-t sm:w-36">
							<div className="flex flex-col py-2">
								{presets.map((preset) => {
									const isActive = activePresetLabel === preset.label
									return (
										<button
											key={preset.label}
											type="button"
											onClick={() => handlePresetClick(preset)}
											className={cn(
												'w-full border-l-2 px-4 py-1.5 text-left text-sm transition-colors',
												'hover:bg-accent hover:text-accent-foreground',
												'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
												isActive
													? 'border-primary bg-accent text-accent-foreground font-medium'
													: 'border-transparent text-muted-foreground',
											)}
										>
											{preset.label}
										</button>
									)
								})}
							</div>
						</div>

						{/* Divider */}
						<Separator orientation="vertical" className="hidden sm:block h-auto" />

						{/* Calendar */}
						<Calendar
							mode="range"
							selected={draft}
							onSelect={(range) => {
								if (range) {
									setDraft(range)
								}
							}}
							month={month}
							onMonthChange={setMonth}
							disabled={disableFuture ? [{ after: today }] : undefined}
							showOutsideDays={false}
							className="p-3"
						/>
					</div>

					{/* Footer */}
					<Separator />
					<div className="flex items-center justify-between px-4 py-3">
						<p className="truncate text-sm text-muted-foreground">
							{draft?.from ? formatRange(draft) : 'Belum dipilih'}
						</p>
						<div className="flex shrink-0 gap-2">
							<Button size="sm" variant="ghost" type="button" onClick={handleCancel}>
								Batal
							</Button>
							<Button size="sm" type="button" onClick={handleApply} disabled={!draft?.from}>
								Terapkan
							</Button>
						</div>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	)
}
