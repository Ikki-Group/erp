// oxlint-disable max-lines
'use client'

import * as React from 'react'

import {
	format,
	subDays,
	startOfMonth,
	endOfMonth,
	subMonths,
	startOfYear,
	startOfDay,
} from 'date-fns'
import { CalendarIcon, XIcon } from 'lucide-react'
import { type DateRange } from 'react-day-picker'

import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
	Drawer,
	DrawerContent,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from '@/components/ui/drawer'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DateRangePickerProps {
	value?: DateRange
	onChange?: (range: DateRange | undefined) => void
	placeholder?: string
	disabled?: boolean
	fromDate?: Date
	toDate?: Date
	className?: string
}

// ─── Presets ──────────────────────────────────────────────────────────────────

interface Preset {
	label: string
	shortLabel: string
	range: () => DateRange
}

// All dates normalised to startOfDay so time drift can't break equality checks.
const PRESETS: Preset[] = [
	{
		label: 'Today',
		shortLabel: 'Today',
		range: () => {
			const d = startOfDay(new Date())
			return { from: d, to: d }
		},
	},
	{
		label: 'Yesterday',
		shortLabel: 'Yesterday',
		range: () => {
			const d = startOfDay(subDays(new Date(), 1))
			return { from: d, to: d }
		},
	},
	{
		label: 'Last 7 days',
		shortLabel: '7 days',
		range: () => ({ from: startOfDay(subDays(new Date(), 6)), to: startOfDay(new Date()) }),
	},
	{
		label: 'Last 14 days',
		shortLabel: '14 days',
		range: () => ({ from: startOfDay(subDays(new Date(), 13)), to: startOfDay(new Date()) }),
	},
	{
		label: 'Last 30 days',
		shortLabel: '30 days',
		range: () => ({ from: startOfDay(subDays(new Date(), 29)), to: startOfDay(new Date()) }),
	},
	{
		label: 'This month',
		shortLabel: 'This mo.',
		range: () => ({ from: startOfDay(startOfMonth(new Date())), to: startOfDay(new Date()) }),
	},
	{
		label: 'Last month',
		shortLabel: 'Last mo.',
		range: () => {
			const prev = subMonths(new Date(), 1)
			return { from: startOfDay(startOfMonth(prev)), to: startOfDay(endOfMonth(prev)) }
		},
	},
	{
		label: 'Last 3 months',
		shortLabel: '3 months',
		range: () => ({ from: startOfDay(subMonths(new Date(), 3)), to: startOfDay(new Date()) }),
	},
	{
		label: 'Last 6 months',
		shortLabel: '6 months',
		range: () => ({ from: startOfDay(subMonths(new Date(), 6)), to: startOfDay(new Date()) }),
	},
	{
		label: 'This year',
		shortLabel: 'This yr.',
		range: () => ({ from: startOfDay(startOfYear(new Date())), to: startOfDay(new Date()) }),
	},
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRange(range: DateRange | undefined): string {
	if (!range?.from) return ''
	if (!range.to || range.from.toDateString() === range.to.toDateString())
		return format(range.from, 'MMM d, yyyy')
	return `${format(range.from, 'MMM d, yyyy')} – ${format(range.to, 'MMM d, yyyy')}`
}

function matchesPreset(preset: Preset, range: DateRange | undefined): boolean {
	if (!range?.from || !range?.to) return false
	const p = preset.range()
	// Compare by date-string after normalising to startOfDay
	return (
		startOfDay(p.from!).toDateString() === startOfDay(range.from).toDateString() &&
		startOfDay(p.to!).toDateString() === startOfDay(range.to).toDateString()
	)
}

// ─── useMediaQuery ────────────────────────────────────────────────────────────

function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = React.useState(
		() => typeof window !== 'undefined' && window.matchMedia(query).matches,
	)
	React.useEffect(() => {
		const mq = window.matchMedia(query)
		setMatches(mq.matches)
		const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
		mq.addEventListener('change', handler)
		return () => mq.removeEventListener('change', handler)
	}, [query])
	return matches
}

// ─── PresetList ───────────────────────────────────────────────────────────────

interface PresetListProps {
	draft: DateRange | undefined
	onSelect: (range: DateRange) => void
	/** vertical = desktop sidebar, horizontal = mobile chips */
	direction: 'vertical' | 'horizontal'
}

function PresetList({ draft, onSelect, direction }: PresetListProps) {
	const activeLabel = PRESETS.find((p) => matchesPreset(p, draft))?.label ?? null

	if (direction === 'vertical') {
		return (
			<div className="flex w-44 shrink-0 flex-col gap-px border-r py-3">
				{PRESETS.map((preset) => {
					const active = activeLabel === preset.label
					return (
						<button
							key={preset.label}
							type="button"
							onClick={() => onSelect(preset.range())}
							className={cn(
								'w-full border-l-2 px-4 py-2 text-left text-sm font-medium transition-colors',
								'hover:bg-accent hover:text-accent-foreground',
								'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
								active
									? 'border-primary bg-accent text-accent-foreground'
									: 'border-transparent text-muted-foreground',
							)}
						>
							{preset.label}
						</button>
					)
				})}
			</div>
		)
	}

	// Horizontal chips (mobile)
	return (
		<div className="flex flex-wrap gap-2 border-b px-4 py-3">
			{PRESETS.map((preset) => {
				const active = activeLabel === preset.label
				return (
					<Button
						key={preset.label}
						type="button"
						size="sm"
						variant={active ? 'default' : 'outline'}
						className="h-7 rounded-full px-3 text-xs"
						onClick={() => onSelect(preset.range())}
					>
						{preset.shortLabel}
					</Button>
				)
			})}
		</div>
	)
}

// ─── PickerFooter ─────────────────────────────────────────────────────────────

function PickerFooter({
	draft,
	onApply,
	onCancel,
}: {
	draft: DateRange | undefined
	onApply: () => void
	onCancel: () => void
}) {
	return (
		<>
			<Separator />
			<div className="flex items-center justify-between px-4 py-3">
				<p className="truncate text-sm text-muted-foreground">
					{draft?.from ? formatRange(draft) : 'No date selected'}
				</p>
				<div className="flex shrink-0 gap-2">
					<Button size="sm" variant="ghost" type="button" onClick={onCancel}>
						Cancel
					</Button>
					<Button size="sm" type="button" onClick={onApply} disabled={!draft?.from}>
						Apply
					</Button>
				</div>
			</div>
		</>
	)
}

// ─── DesktopCalendars ─────────────────────────────────────────────────────────
//
// Two separate <Calendar numberOfMonths={1}> instances sharing a `leftMonth`
// state. This sidesteps the cross-month range-highlight bug in react-day-picker
// v9's built-in `numberOfMonths={2}` mode, and lets us control nav independently.

interface DesktopCalendarsProps {
	draft: DateRange | undefined
	setDraft: React.Dispatch<React.SetStateAction<DateRange | undefined>>
	fromDate?: Date
	toDate?: Date
}

function DesktopCalendars({ draft, setDraft, fromDate, toDate }: DesktopCalendarsProps) {
	return (
		<div className="flex gap-0 divide-x overflow-auto">
			<Calendar
				mode="range"
				captionLayout="dropdown"
				selected={draft}
				onSelect={setDraft}
				numberOfMonths={2}
				startMonth={fromDate}
				endMonth={toDate}
				defaultMonth={
					draft?.from ? new Date(draft.from.getFullYear(), draft.from.getMonth(), 1) : undefined
				}
				showOutsideDays={false}
				className="w-full [--cell-size:--spacing(10)] p-4"
			/>
		</div>
	)
}

// ─── MobileCalendar ───────────────────────────────────────────────────────────
//
// Single month. Key fix: `className="w-full [--cell-size:--spacing(10)]"`
// makes the calendar fill the drawer width and sizes cells to 40 px so days
// are tap-friendly without overflowing.

interface MobileCalendarProps {
	draft: DateRange | undefined
	setDraft: React.Dispatch<React.SetStateAction<DateRange | undefined>>
	fromDate?: Date
	toDate?: Date
}

function MobileCalendar({ draft, setDraft, fromDate, toDate }: MobileCalendarProps) {
	return (
		<Calendar
			mode="range"
			captionLayout="dropdown"
			selected={draft}
			onSelect={setDraft}
			numberOfMonths={1}
			startMonth={fromDate}
			endMonth={toDate}
			showOutsideDays={false}
			defaultMonth={
				draft?.from ? new Date(draft.from.getFullYear(), draft.from.getMonth(), 1) : undefined
			}
			className="w-full [--cell-size:--spacing(10)] p-4"
		/>
	)
}

// ─── PickerContent ────────────────────────────────────────────────────────────

interface PickerContentProps {
	draft: DateRange | undefined
	setDraft: React.Dispatch<React.SetStateAction<DateRange | undefined>>
	onApply: () => void
	onCancel: () => void
	isDesktop: boolean
	fromDate?: Date
	toDate?: Date
}

function PickerContent({
	draft,
	setDraft,
	onApply,
	onCancel,
	isDesktop,
	fromDate,
	toDate,
}: PickerContentProps) {
	function handlePreset(range: DateRange) {
		setDraft(range)
	}

	if (isDesktop) {
		return (
			<div className="flex flex-col">
				<div className="flex">
					<PresetList draft={draft} onSelect={handlePreset} direction="vertical" />
					<DesktopCalendars draft={draft} setDraft={setDraft} fromDate={fromDate} toDate={toDate} />
				</div>
				<PickerFooter draft={draft} onApply={onApply} onCancel={onCancel} />
			</div>
		)
	}

	return (
		<div className="flex flex-col">
			<PresetList draft={draft} onSelect={handlePreset} direction="horizontal" />
			<MobileCalendar draft={draft} setDraft={setDraft} fromDate={fromDate} toDate={toDate} />
			<PickerFooter draft={draft} onApply={onApply} onCancel={onCancel} />
		</div>
	)
}

// ─── DateRangePicker (public API) ─────────────────────────────────────────────

/**
 * @deprecated
 */
export function DateRangePicker({
	value,
	onChange,
	placeholder = 'Pick a date range',
	disabled = false,
	fromDate,
	toDate,
	className,
}: DateRangePickerProps) {
	const isDesktop = useMediaQuery('(min-width: 768px)')
	const [open, setOpen] = React.useState(false)
	const [draft, setDraft] = React.useState<DateRange | undefined>(value)

	// Sync draft ← value every time the popover/drawer opens
	React.useEffect(() => {
		if (open) setDraft(value)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open])

	function handleApply() {
		onChange?.(draft)
		setOpen(false)
	}

	function handleCancel() {
		setDraft(value)
		setOpen(false)
	}

	function handleClear(e: React.MouseEvent) {
		e.stopPropagation()
		onChange?.(null!)
	}

	const hasValue = Boolean(value?.from)

	// Shared trigger element — rendered inside PopoverTrigger or DrawerTrigger
	const trigger = (
		<Button
			variant="outline"
			disabled={disabled}
			data-empty={!hasValue}
			className={cn(
				'w-full justify-start gap-2 text-left font-normal',
				'data-[empty=true]:text-muted-foreground',
				className,
			)}
		>
			<CalendarIcon className="size-4 shrink-0 opacity-50" />
			<span className="flex-1 truncate">{hasValue ? formatRange(value) : placeholder}</span>
			{hasValue && (
				<span
					role="button"
					tabIndex={0}
					aria-label="Clear selection"
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
		</Button>
	)

	const contentProps: PickerContentProps = {
		draft,
		setDraft,
		onApply: handleApply,
		onCancel: handleCancel,
		isDesktop,
		fromDate,
		toDate,
	}

	// ── Desktop → Popover ──────────────────────────────────────────────────────
	if (isDesktop) {
		return (
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger render={trigger} />
				<PopoverContent className="w-auto p-0" align="start" sideOffset={8}>
					<PickerContent {...contentProps} />
				</PopoverContent>
			</Popover>
		)
	}

	// ── Mobile → Drawer ────────────────────────────────────────────────────────
	return (
		<Drawer open={open} onOpenChange={setOpen}>
			<DrawerTrigger asChild>{trigger}</DrawerTrigger>
			<DrawerContent className="max-h-[92dvh]">
				<DrawerHeader className="pb-0 text-left">
					<DrawerTitle>Select date range</DrawerTitle>
				</DrawerHeader>
				{/* overflow-y-auto lets the content scroll inside the drawer */}
				<div className="overflow-y-auto">
					<PickerContent {...contentProps} />
				</div>
				{/* Provides bottom safe-area padding on iOS */}
				<DrawerFooter className="pt-0" />
			</DrawerContent>
		</Drawer>
	)
}
