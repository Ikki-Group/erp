import * as React from 'react'

import { Link, type LinkProps } from '@tanstack/react-router'

import {
	CheckIcon,
	MoreHorizontalIcon,
	TrendingDownIcon,
	TrendingUpIcon,
	XIcon,
} from 'lucide-react'

import { toCurrency, toDate, toDateTimeStamp, toNumber } from '@/lib/formatter'
import { cn } from '@/lib/utils'

import { Badge } from '@/components/reui/badge'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

interface CellBaseProps {
	className?: string
}

export interface CellTextProps extends CellBaseProps {
	value: React.ReactNode | string | number | null | undefined
}

export interface CellDateProps extends CellBaseProps {
	value: Date | string | number | null | undefined
	variant?: 'date' | 'datetime'
}

export interface CellNumberProps extends CellBaseProps {
	value: number | string | null | undefined
}

export interface CellCurrencyProps extends CellBaseProps {
	value: number | string | null | undefined
}

export interface CellLabelDescProps extends CellBaseProps {
	label: React.ReactNode
	desc?: React.ReactNode
}

export interface CellLinkProps extends CellBaseProps, Omit<LinkProps, 'className'> {}

export interface CellAvatarProps extends CellBaseProps {
	src?: string
	fallback?: string
	label?: React.ReactNode
	desc?: React.ReactNode
	size?: 'default' | 'sm' | 'lg'
}

export interface CellBooleanProps extends CellBaseProps {
	value: boolean | null | undefined
}

export interface CellBadgeGroupProps extends CellBaseProps {
	values: string[]
	max?: number
}

export interface CellProgressProps extends CellBaseProps {
	value: number
	label?: React.ReactNode
}

export interface CellTrendProps extends CellBaseProps {
	value: number | string
	trend?: 'up' | 'down' | 'neutral'
	reverse?: boolean
}

export interface CellActionProps extends CellBaseProps {
	label?: string
	icon?: React.ReactNode
	variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link'
	size?: 'default' | 'xs' | 'sm' | 'lg' | 'icon' | 'icon-xs' | 'icon-sm' | 'icon-lg'
	disabled?: boolean
	onClick?: React.MouseEventHandler<HTMLButtonElement>
}

export interface CellActionLinkProps extends CellBaseProps {
	label?: string
	icon?: React.ReactNode
	variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link'
	size?: 'default' | 'xs' | 'sm' | 'lg' | 'icon' | 'icon-xs' | 'icon-sm' | 'icon-lg'
	disabled?: boolean
}

export interface CellActionsProps extends CellBaseProps {
	children: React.ReactNode
}

export type CellMenuItem =
	| {
			type: 'button'
			label: string
			icon?: React.ReactNode
			onClick?: () => void
			disabled?: boolean
			variant?: 'default' | 'destructive'
	  }
	| { type: 'link'; label: string; icon?: React.ReactNode; to: string; disabled?: boolean }
	| { type: 'separator' }

export interface CellMenuProps extends CellBaseProps {
	items: CellMenuItem[]
	label?: string
	icon?: React.ReactNode
}

/* -------------------------------------------------------------------------- */
/*                               CELL COMPONENTS                              */
/* -------------------------------------------------------------------------- */

/** Primary label + optional secondary description. Best for ID/name columns. */
export function CellLabelDesc({ label, desc, className }: CellLabelDescProps) {
	return (
		<div className={cn('flex flex-col gap-0.5 min-w-0 py-1', className)}>
			<div className="font-medium text-foreground truncate">{label}</div>
			{desc && <div className="text-xs text-muted-foreground truncate">{desc}</div>}
		</div>
	)
}

/** Standard text cell with truncation and fallback. */
export function CellText({ value, className }: CellTextProps) {
	return <span className={cn('truncate block text-sm', className)}>{renderFallback(value)}</span>
}

/** Date cell with ERP standard formatting. Default is datetime. */
export function CellDate({ value, variant = 'datetime', className }: CellDateProps) {
	if (!hasValue(value)) return <span className="text-muted-foreground">-</span>
	const formatted = variant === 'datetime' ? toDateTimeStamp(value) : toDate(value)
	return <span className={cn('text-nowrap tabular-nums text-sm', className)}>{formatted}</span>
}

/** Numeric cell with localized formatting and right alignment. */
export function CellNumber({ value, className }: CellNumberProps) {
	return (
		<div className={cn('text-right tabular-nums w-full text-sm', className)}>
			{hasValue(value) ? toNumber(value) : <span className="text-muted-foreground">-</span>}
		</div>
	)
}

/** Currency cell (IDR) with localized formatting, semi-bold font, and right alignment. */
export function CellCurrency({ value, className }: CellCurrencyProps) {
	return (
		<div className={cn('text-right tabular-nums w-full font-medium text-sm', className)}>
			{hasValue(value) ? toCurrency(value) : <span className="text-muted-foreground">-</span>}
		</div>
	)
}

/** Composable Link cell using TanStack Router. */
export function CellLink({ className, ...props }: CellLinkProps) {
	return (
		<Link
			{...props}
			className={cn(
				'font-medium text-primary hover:underline transition-all cursor-pointer inline-block text-sm',
				className,
			)}
		/>
	)
}

/** Avatar followed by a label/description. */
export function CellAvatar({
	src,
	fallback,
	label,
	desc,
	className,
	size = 'sm',
}: CellAvatarProps) {
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

/** Boolean indicator (Check or X). */
export function CellBoolean({ value, className }: CellBooleanProps) {
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

/** Action button cell. */
export function CellAction({
	label,
	icon,
	variant = 'ghost',
	size = 'icon-sm',
	className,
	disabled,
	onClick,
}: CellActionProps) {
	return (
		<Button
			variant={variant}
			size={size}
			className={className}
			disabled={disabled}
			onClick={onClick}
			aria-label={label}
		>
			{icon ?? null}
			{label && <span>{label}</span>}
		</Button>
	)
}

/** Action link cell using TanStack Router. */
export function CellActionLink({
	label,
	icon,
	variant = 'ghost',
	size = 'icon-sm',
	className,
	disabled,
	...linkProps
}: CellActionLinkProps & Omit<LinkProps, 'className'>) {
	return (
		<Button variant={variant} size={size} className={className} disabled={disabled}>
			<Link {...(linkProps as any)} aria-label={label}>
				{icon ?? null}
				{label && <span>{label}</span>}
			</Link>
		</Button>
	)
}

/** Container for multiple actions. */
export function CellActions({ children, className }: CellActionsProps) {
	return <div className={cn('flex items-center gap-1', className)}>{children}</div>
}

/** Dropdown menu cell with items array (button, link, or separator). */
export function CellMenu({ items, label, icon, className }: CellMenuProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				className={cn('flex items-center justify-center', className)}
				aria-label={label ?? 'Menu'}
			>
				<Button variant="ghost" size="icon-sm">
					{icon ?? <MoreHorizontalIcon />}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{items.map((item, i) => {
					if (item.type === 'separator') return <DropdownMenuSeparator key={i} />

					if (item.type === 'link') {
						return (
							<DropdownMenuItem key={i} disabled={item.disabled}>
								<Link to={item.to} className="flex items-center gap-2 w-full">
									{item.icon}
									<span>{item.label}</span>
								</Link>
							</DropdownMenuItem>
						)
					}

					return (
						<DropdownMenuItem
							key={i}
							variant={item.variant}
							disabled={item.disabled}
							onClick={item.onClick}
						>
							{item.icon}
							<span>{item.label}</span>
						</DropdownMenuItem>
					)
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

/** Badge group with overflow count. */
export function CellBadgeGroup({ values, max = 3, className }: CellBadgeGroupProps) {
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

/** Progress bar cell. */
export function CellProgress({ value, label, className }: CellProgressProps) {
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

/** Trend indicator with arrow and color coding. */
export function CellTrend({ value, trend, className, reverse = false }: CellTrendProps) {
	const isUp = trend === 'up'
	const isDown = trend === 'down'
	const colorClass = cn(
		!trend && 'text-foreground',
		isUp && (reverse ? 'text-destructive' : 'text-emerald-500'),
		isDown && (reverse ? 'text-emerald-500' : 'text-destructive'),
	)
	return (
		<div
			className={cn(
				'flex items-center gap-1 font-medium tabular-nums text-sm',
				colorClass,
				className,
			)}
		>
			{isUp && <TrendingUpIcon className="size-3.5" />}
			{isDown && <TrendingDownIcon className="size-3.5" />}
			{value}
		</div>
	)
}
