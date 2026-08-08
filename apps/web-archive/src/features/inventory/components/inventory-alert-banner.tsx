import { useState, useEffect } from 'react'

import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { AlertTriangleIcon, ArrowRightIcon, XIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { stockAlertApi } from '../api/inventory.api'

export function InventoryAlertBanner() {
	const [isDismissed, setIsDismissed] = useState(false)
	const { data } = useQuery(stockAlertApi.count.query({}))
	const count = data?.data.count ?? 0

	// Re-appear after 5 minutes if dismissed
	useEffect(() => {
		if (isDismissed) {
			const timer = setTimeout(() => setIsDismissed(false), 5 * 60 * 1000)
			return () => clearTimeout(timer)
		}
	}, [isDismissed])

	if (count === 0 || isDismissed) return null

	return (
		<div className="bg-warning/10 border-b border-warning/20 px-4 py-2.5 flex items-center justify-between gap-4 animate-in slide-in-from-top duration-500">
			<div className="flex items-center gap-3">
				<div className="bg-warning/20 p-1.5 rounded-full text-warning">
					<AlertTriangleIcon className="size-4" />
				</div>
				<div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
					<p className="text-sm font-semibold text-warning-foreground">Peringatan Stok Rendah</p>
					<p className="text-xs text-warning-foreground/70">
						Ada <span className="font-bold text-warning-foreground">{count} item</span> yang berada
						di bawah level stok minimum.
					</p>
				</div>
			</div>
			<div className="flex items-center gap-2">
				<Button
					variant="ghost"
					size="xs"
					className="text-warning-foreground hover:bg-warning/20 hover:text-warning-foreground font-bold shrink-0"
					nativeButton={false}
					render={<Link to="/inventory/summary" />}
				>
					Lihat Detail <ArrowRightIcon className="ml-1.5 size-3" />
				</Button>
				<Button
					variant="ghost"
					size="icon-xs"
					className="text-warning-foreground/40 hover:text-warning-foreground shrink-0"
					onClick={() => setIsDismissed(true)}
				>
					<XIcon className="size-3.5" />
				</Button>
			</div>
		</div>
	)
}
