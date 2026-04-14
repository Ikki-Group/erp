import type { BadgeProps } from '@/components/reui/badge'
import { Badge } from '@/components/reui/badge'

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface StatusConfig {
	label: string
	variant: BadgeProps['variant']
	/** Whether to show dot indicator */
	dot?: boolean
}

export type StatusMap<TKey extends string = string> = Record<TKey, StatusConfig>

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

interface StatusBadgeProps<TKey extends string = string> extends Omit<
	BadgeProps,
	'variant' | 'children'
> {
	status: TKey
	statusMap: StatusMap<TKey>
}

export function StatusBadge<TKey extends string>({
	status,
	statusMap,
	className,
	...props
}: StatusBadgeProps<TKey>) {
	const config = statusMap[status]

	if (!config) return null

	return (
		<Badge variant={config.variant} className={className} {...props}>
			{config.dot && <span className="ms-px size-1.25 rounded-full! bg-[currentColor]" />}
			{config.label}
		</Badge>
	)
}

/* -------------------------------------------------------------------------- */
/*  Factory: createStatusBadge                                                */
/* -------------------------------------------------------------------------- */

/**
 * Creates a pre-configured StatusBadge component with a fixed statusMap.
 *
 * @example
 * ```tsx
 * const ActiveBadge = createStatusBadge({
 *   active: { label: 'Aktif', variant: 'success-outline', dot: true },
 *   inactive: { label: 'Tidak Aktif', variant: 'destructive-outline', dot: true },
 * })
 *
 * // Usage: <ActiveBadge status="active" />
 * ```
 */
export function createStatusBadge<TKey extends string>(map: StatusMap<TKey>) {
	return function PresetStatusBadge(props: Omit<StatusBadgeProps<TKey>, 'statusMap'>) {
		return <StatusBadge<TKey> statusMap={map} {...props} />
	}
}

/* -------------------------------------------------------------------------- */
/*  Presets                                                                   */
/* -------------------------------------------------------------------------- */

/** Active/Inactive status — commonly used across ERP entities */
export const activeStatusMap = {
	active: { label: 'Aktif', variant: 'success-outline' as const, dot: true },
	inactive: { label: 'Tidak Aktif', variant: 'destructive-outline' as const, dot: true },
} satisfies StatusMap<'active' | 'inactive'>

export const ActiveStatusBadge = createStatusBadge(activeStatusMap)

/** Helper: maps a boolean to the active status key */
export function toActiveStatus(isActive: boolean): 'active' | 'inactive' {
	return isActive ? 'active' : 'inactive'
}
