import * as React from 'react'

import { Link, type LinkProps } from '@tanstack/react-router'

import { CheckIcon, TrendingDownIcon, TrendingUpIcon, XIcon } from 'lucide-react'

import { toCurrency, toDate, toDateTimeStamp, toNumber } from '@/lib/formatter'
import { cn } from '@/lib/utils'

import { Badge } from '@/components/reui/badge'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

/* -------------------------------------------------------------------------- */
/*                                 SHARED UTILS                               */
/* -------------------------------------------------------------------------- */

function hasValue<T>(value: T | null | undefined): value is T {
	return value !== null && value !== undefined && value !== ''
}

function renderFallback(value: React.ReactNode, fallback = '-'): React.ReactNode {
	return hasValue(value) ? value : <span className="text-muted-foreground">{fallback}</span>
}

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface BaseProps {
	className?: string
}

interface DataGridCellLabelAndDescProps extends BaseProps {
	label: React.ReactNode
	desc?: React.ReactNode
}

interface DataGridCellTextProps extends BaseProps {
	value: React.ReactNode | string | number | null | undefined
}

interface DataGridCellDateProps extends BaseProps {
	value: Date | string | number | null | undefined
	variant?: 'date' | 'datetime'
}

interface DataGridCellNumberProps extends BaseProps {
	value: number | string | null | undefined
}

interface DataGridCellCurrencyProps extends BaseProps {
	value: number | string | null | undefined
}

interface DataGridCellAvatarProps extends BaseProps {
	src?: string
	fallback?: string
	label?: React.ReactNode
	desc?: React.ReactNode
	size?: 'default' | 'sm' | 'lg'
}

interface DataGridCellBooleanProps extends BaseProps {
	value: boolean | null | undefined
}

interface DataGridCellBadgeGroupProps extends BaseProps {
	values: string[]
	max?: number
}

interface DataGridCellProgressProps {
	value: number
	label?: React.ReactNode
	className?: string
}

interface DataGridCellTrendProps {
	value: number | string
	trend?: 'up' | 'down' | 'neutral'
	className?: string
	reverse?: boolean
}

type DataGridCellActionProps = {
	label?: string
	icon?: React.ReactNode
	variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link'
	size?: 'default' | 'xs' | 'sm' | 'lg' | 'icon' | 'icon-xs' | 'icon-sm' | 'icon-lg'
	className?: string
	disabled?: boolean
} & (
	| { type: 'button'; onClick?: React.MouseEventHandler<HTMLButtonElement> }
	| ({ type: 'link' } & LinkProps)
)

/**
 * Renders a primary label and an optional secondary description in a stacked layout.
 * Best for ID columns or main entity names.
 */
function DataGridCellLabelAndDesc({ label, desc, className }: DataGridCellLabelAndDescProps) {
	return (
		<div className={cn('flex flex-col gap-0.5 min-w-0 py-1', className)}>
			<div className="font-medium text-foreground truncate">{label}</div>
			{desc && <div className="text-xs text-muted-foreground truncate">{desc}</div>}
		</div>
	)
}

/**
 * Standard text cell with truncation and fallback.
 */
function DataGridCellText({ value, className }: DataGridCellTextProps) {
	return <span className={cn('truncate block text-sm', className)}>{renderFallback(value)}</span>
}

/**
 * Date cell with ERP standard formatting. Default is datetime.
 */
function DataGridCellDate({ value, variant = 'datetime', className }: DataGridCellDateProps) {
	if (!value) return <span className="text-muted-foreground">-</span>

	const formatted = variant === 'datetime' ? toDateTimeStamp(value) : toDate(value)

	return <span className={cn('text-nowrap tabular-nums text-sm', className)}>{formatted}</span>
}

/**
 * Numeric cell with localized formatting and right alignment.
 */
function DataGridCellNumber({ value, className }: DataGridCellNumberProps) {
	return (
		<div className={cn('text-right tabular-nums w-full text-sm', className)}>
			{value === null || value === undefined || value === '' ? '-' : toNumber(value)}
		</div>
	)
}

/**
 * Currency cell (IDR) with localized formatting, semi-bold font, and right alignment.
 */
function DataGridCellCurrency({ value, className }: DataGridCellCurrencyProps) {
	return (
		<div className={cn('text-right tabular-nums w-full font-medium text-sm', className)}>
			{value === null || value === undefined || value === '' ? '-' : toCurrency(value)}
		</div>
	)
}

/**
 * Composable Link cell using TanStack Router.
 */
function DataGridCellLink(props: React.ComponentProps<typeof Link>) {
	return (
		<Link
			{...props}
			className={cn(
				'font-medium text-primary hover:underline transition-all cursor-pointer inline-block text-sm',
				props.className,
			)}
		/>
	)
}

/**
 * Renders an avatar followed by a label/description.
 */
function DataGridCellAvatar({
	src,
	fallback,
	label,
	desc,
	className,
	size = 'sm',
}: DataGridCellAvatarProps) {
	return (
		<div className={cn('flex items-center gap-2.5 py-1', className)}>
			<Avatar size={size}>
				<AvatarImage src={src} alt={typeof label === 'string' ? label : ''} />
				<AvatarFallback>{fallback ?? '?'}</AvatarFallback>
			</Avatar>
			{(label ?? desc) && (
				<div className="flex flex-col min-w-0">
					{label && <div className="font-medium text-foreground truncate text-sm">{label}</div>}
					{desc && <div className="text-xs text-muted-foreground truncate">{desc}</div>}
				</div>
			)}
		</div>
	)
}

/**
 * Renders a Boolean indicator (Check or X).
 */
function DataGridCellBoolean({ value, className }: DataGridCellBooleanProps) {
	if (value === null || value === undefined) return <span className="text-muted-foreground">-</span>

	return (
		<div className={cn('flex items-center justify-center w-fit', className)}>
			{value ? (
				<CheckIcon className="size-4 text-emerald-500" />
			) : (
				<XIcon className="size-4 text-destructive" />
			)}
		</div>
	)
}

/**
 * Individual action component (Button or Link).
 * Follows Base UI asChild pattern and TanStack Router Link conventions.
 */
function DataGridCellAction(props: DataGridCellActionProps) {
	const { label, icon, variant = 'ghost', size = 'icon-sm', className, disabled } = props

	const content = (
		<>
			{icon ?? null}
			{label && <span>{label}</span>}
		</>
	)

	if (props.type === 'link') {
		const { type: _type, label: _label, icon: _icon, ...linkProps } = props
		return (
			<Button variant={variant} size={size} className={className} disabled={disabled}>
				<Link {...(linkProps as any)} aria-label={label ?? undefined}>
					{content}
				</Link>
			</Button>
		)
	}

	return (
		<Button
			variant={variant}
			size={size}
			className={className}
			onClick={props.onClick}
			disabled={disabled}
			aria-label={label ?? undefined}
		>
			{content}
		</Button>
	)
}

/**
 * Container for multiple actions.
 */
function DataGridCellActions({
	children,
	className,
}: {
	children: React.ReactNode
	className?: string
}) {
	return <div className={cn('flex items-center gap-1', className)}>{children}</div>
}

/**
 * Renders a group of badges, optionally capping the display and showing a count.
 */
function DataGridCellBadgeGroup({ values, max = 3, className }: DataGridCellBadgeGroupProps) {
	if (!values || values.length === 0) return <span className="text-muted-foreground">-</span>

	const displayed = values.slice(0, max)
	const remaining = values.length - max

	return (
		<div className={cn('flex flex-wrap gap-1', className)}>
			{displayed.map((v, i) => (
				<Badge key={i} variant="secondary">
					{v}
				</Badge>
			))}
			{remaining > 0 && <Badge variant="outline">+{remaining}</Badge>}
		</div>
	)
}

/**
 * Renders a progress bar within a cell.
 */
function DataGridCellProgress({ value, label, className }: DataGridCellProgressProps) {
	return (
		<div className={cn('flex flex-col gap-1 w-full max-w-30', className)}>
			{label && (
				<div className="text-[10px] text-muted-foreground uppercase font-bold">{label}</div>
			)}
			<Progress value={value} className="gap-0" />
			<div className="text-[10px] text-muted-foreground tabular-nums text-right">{value}%</div>
		</div>
	)
}

/**
 * Renders a trend indicator (arrow up/down) with color coding.
 */
function DataGridCellTrend({ value, trend, className, reverse = false }: DataGridCellTrendProps) {
	const isPositive = trend === 'up'
	const isNegative = trend === 'down'

	const colorClass = cn(
		!trend && 'text-foreground',
		isPositive && (reverse ? 'text-destructive' : 'text-emerald-500'),
		isNegative && (reverse ? 'text-emerald-500' : 'text-destructive'),
	)

	return (
		<div
			className={cn(
				'flex items-center gap-1 font-medium tabular-nums text-sm',
				colorClass,
				className,
			)}
		>
			{isPositive && <TrendingUpIcon className="size-3.5" />}
			{isNegative && <TrendingDownIcon className="size-3.5" />}
			{value}
		</div>
	)
}

/* -------------------------------------------------------------------------- */
/*                            CELL REGISTRY (SCALABLE)                        */
/* -------------------------------------------------------------------------- */

/** Map of cell type keys to React components. */
export type CellRegistryMap = Record<string, React.ComponentType<any>>

const CellRegistryContext = React.createContext<CellRegistryMap>({})

/**
 * Provider that lets features register custom cell types at runtime.
 * Wrap your DataTable or page with this to make custom cells available
 * to DataGridCellRenderer declaratively.
 */
export function CellRegistryProvider({
	registry,
	children,
}: {
	registry: CellRegistryMap
	children: React.ReactNode
}) {
	return <CellRegistryContext.Provider value={registry}>{children}</CellRegistryContext.Provider>
}

/** Hook to read the current cell registry. */
export function useCellRegistry(): CellRegistryMap {
	return React.useContext(CellRegistryContext)
}

/* -------------------------------------------------------------------------- */
/*                          DECLARATIVE RENDERER                                */
/* -------------------------------------------------------------------------- */

/** Discriminated union for every built-in cell type. */
export type DataGridCellSpec =
	| { type: 'text'; props: DataGridCellTextProps }
	| { type: 'date'; props: DataGridCellDateProps }
	| { type: 'number'; props: DataGridCellNumberProps }
	| { type: 'currency'; props: DataGridCellCurrencyProps }
	| { type: 'label-desc'; props: DataGridCellLabelAndDescProps }
	| { type: 'link'; props: React.ComponentProps<typeof Link> }
	| { type: 'avatar'; props: DataGridCellAvatarProps }
	| { type: 'boolean'; props: DataGridCellBooleanProps }
	| { type: 'badge-group'; props: DataGridCellBadgeGroupProps }
	| { type: 'progress'; props: DataGridCellProgressProps }
	| { type: 'trend'; props: DataGridCellTrendProps }
	| { type: 'action'; props: DataGridCellActionProps }
	| { type: 'actions'; props: React.ComponentProps<'div'> & { children: React.ReactNode } }
	| { type: string; props: Record<string, unknown> }

const BUILT_IN_MAP: Record<string, React.ComponentType<any>> = {
	text: DataGridCellText,
	date: DataGridCellDate,
	number: DataGridCellNumber,
	currency: DataGridCellCurrency,
	'label-desc': DataGridCellLabelAndDesc,
	link: DataGridCellLink,
	avatar: DataGridCellAvatar,
	boolean: DataGridCellBoolean,
	'badge-group': DataGridCellBadgeGroup,
	progress: DataGridCellProgress,
	trend: DataGridCellTrend,
	action: DataGridCellAction,
	actions: DataGridCellActions,
}

/**
 * Declarative cell renderer. Accepts a discriminated union `cell` prop and
 * automatically maps to the correct component. Supports custom types
 * registered via CellRegistryProvider.
 *
 * @example
 * <DataGridCellRenderer cell={{ type: 'currency', props: { value: 150000 } }} />
 * <DataGridCellRenderer cell={{ type: 'myCustom', props: { foo: 'bar' } }} />
 */
export function DataGridCellRenderer({ cell }: { cell: DataGridCellSpec }) {
	const registry = useCellRegistry()
	const Component = registry[cell.type] ?? BUILT_IN_MAP[cell.type]

	if (!Component) {
		console.warn(`[DataGridCellRenderer] Unknown cell type "${cell.type}"`)
		return <span className="text-muted-foreground">-</span>
	}

	return <Component {...cell.props} />
}

/* -------------------------------------------------------------------------- */
/*                                EXPORTS                                     */
/* -------------------------------------------------------------------------- */

export const DataGridCell = {
	LabelAndDesc: DataGridCellLabelAndDesc,
	Text: DataGridCellText,
	Date: DataGridCellDate,
	Number: DataGridCellNumber,
	Currency: DataGridCellCurrency,
	Link: DataGridCellLink,
	Avatar: DataGridCellAvatar,
	Boolean: DataGridCellBoolean,
	Action: DataGridCellAction,
	Actions: DataGridCellActions,
	BadgeGroup: DataGridCellBadgeGroup,
	Progress: DataGridCellProgress,
	Trend: DataGridCellTrend,
}
