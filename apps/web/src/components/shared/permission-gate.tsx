import type { ReactNode } from 'react'

import { useAuth } from '@/providers/auth-provider.tsx'

export interface PermissionGateProps {
	/** Render children if the user has this single permission. */
	permission?: string
	/** Render children if the user has at least one of these permissions. */
	anyOf?: string[]
	/** Render children only if the user has every one of these permissions. */
	allOf?: string[]
	/** Rendered when the permission check fails. Omit to render nothing (the default — hides gated actions instead of disabling them). */
	fallback?: ReactNode
	children: ReactNode
}

/**
 * Gates its children behind a permission check, replacing the copy-pasted
 * `const canX = useHasPermission('module:write')` + `{canX ? <Button/> : undefined}`
 * pattern that a handful of routes hand-rolled ad hoc (and most routes
 * skipped entirely, despite the server enforcing the same RBAC model).
 * Owners always pass (see `useHasPermission`).
 *
 * ```tsx
 * <PermissionGate permission="location.create">
 *   <Button size="sm" onClick={handleCreate}>Add Location</Button>
 * </PermissionGate>
 * ```
 *
 * For an action-menu item that needs the *boolean* (e.g. to decide whether
 * the whole menu should render), use `useHasPermission`/`usePermissions`
 * directly instead — this component is for gating rendered output, not for
 * branching logic.
 */
export function PermissionGate({
	permission,
	anyOf,
	allOf,
	fallback = null,
	children,
}: PermissionGateProps) {
	const granted = usePermissionCheck({ permission, anyOf, allOf })
	return granted ? children : fallback
}

export interface UsePermissionCheckOptions {
	permission?: string
	anyOf?: string[]
	allOf?: string[]
}

/**
 * The check `PermissionGate` renders against — exposed directly for the
 * cases that need the boolean itself (disabling a button instead of hiding
 * it, gating an entire route component, deciding whether an action-menu
 * item array is empty).
 */
export function usePermissionCheck({
	permission,
	anyOf,
	allOf,
}: UsePermissionCheckOptions): boolean {
	const { permissions, isOwner } = useAuth()
	if (isOwner) return true

	if (permission && !permissions.includes(permission)) return false
	if (anyOf && anyOf.length > 0 && !anyOf.some((p) => permissions.includes(p))) return false
	if (allOf && allOf.length > 0 && !allOf.every((p) => permissions.includes(p))) return false

	return true
}
