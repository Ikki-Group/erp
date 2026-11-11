import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface DetailIconProps {
	icon: ReactNode
	className?: string
}

/**
 * Icon wrapper for detail sections with proper sizing (size-5).
 * Maintains visual consistency across all detail pages.
 * Use with Lucide icons.
 */
export function DetailIcon({ icon, className }: DetailIconProps) {
	return <div className={cn('size-5', className)}>{icon}</div>
}
