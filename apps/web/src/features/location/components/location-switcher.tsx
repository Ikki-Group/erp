import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { useActiveLocation } from '@/hooks/use-active-location'

import { CheckIcon, ChevronsUpDownIcon, LockIcon, MapPinIcon, WarehouseIcon } from 'lucide-react'
import { toast } from 'sonner'

/**
 * LocationSwitcher — Global location context pill for the app header.
 *
 * Features:
 * - Shows active location as a pill button
 * - Dropdown to switch between assigned locations
 * - "Consolidated View" option for multi-location users
 * - Auto-locks on form/create pages to prevent mid-edit disruptions
 * - Toast feedback on location change
 */
export function LocationSwitcher() {
	const {
		locationId,
		isConsolidated,
		label,
		locations,
		hasMultiple,
		activeLocation,
		switchTo,
		switchToAll,
	} = useActiveLocation()

	// Detect if user is on a form/create route (contains /create, /edit, /adjustment, /transfer)
	const isFormPage = useIsFormPage()

	// Don't render if user has zero locations
	if (locations.length === 0) return null

	// Single location user — show static pill, no dropdown
	if (!hasMultiple) {
		return (
			<div className="flex items-center gap-2 rounded-full border border-muted/60 bg-secondary/40 px-3 py-1.5 text-sm">
				<MapPinIcon className="size-3.5 text-primary" />
				<span className="font-medium text-foreground/80 truncate max-w-[160px]">
					{locations[0]?.name ?? 'Lokasi'}
				</span>
			</div>
		)
	}

	// Form page — show locked pill with tooltip
	if (isFormPage && !isConsolidated) {
		return (
			<div
				className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/5 px-3 py-1.5 text-sm cursor-not-allowed"
				title="Lokasi terkunci saat mengisi formulir"
			>
				<LockIcon className="size-3.5 text-amber-600" />
				<span className="font-medium text-amber-700 truncate max-w-[160px]">
					{activeLocation?.name ?? label}
				</span>
			</div>
		)
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						variant="outline"
						size="sm"
						className="h-9 gap-2 rounded-full border-muted/60 bg-secondary/30 px-3 hover:bg-secondary/60 transition-colors"
					/>
				}
			>
				{isConsolidated ? (
					<WarehouseIcon className="size-3.5 text-primary" />
				) : (
					<MapPinIcon className="size-3.5 text-primary" />
				)}
				<span className="font-medium text-foreground/90 truncate max-w-[160px]">{label}</span>
				<ChevronsUpDownIcon className="size-3.5 text-muted-foreground" />
			</DropdownMenuTrigger>

			<DropdownMenuContent className="w-64 rounded-xl" align="start" sideOffset={8}>
				<DropdownMenuGroup>
					<DropdownMenuLabel className="text-xs text-muted-foreground font-semibold uppercase tracking-wider px-3 py-2">
						Pilih Lokasi Kerja
					</DropdownMenuLabel>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />

				{/* Consolidated View Option */}
				<DropdownMenuGroup>
					<DropdownMenuItem
						onClick={() => {
							switchToAll()
							toast.success('Menampilkan semua lokasi', {
								description: 'Data dari seluruh lokasi ditampilkan.',
							})
						}}
						className="gap-3 px-3 py-2.5 cursor-pointer"
					>
						<div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
							<WarehouseIcon className="size-4" />
						</div>
						<div className="flex-1">
							<span className="font-medium">Semua Lokasi</span>
							<p className="text-[11px] text-muted-foreground">
								{locations.length} lokasi (gabungan)
							</p>
						</div>
						{isConsolidated && <CheckIcon className="size-4 text-primary" />}
					</DropdownMenuItem>
				</DropdownMenuGroup>

				<DropdownMenuSeparator />

				{/* Individual Locations */}
				<DropdownMenuGroup>
					<DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider px-3 py-1">
						Lokasi Spesifik
					</DropdownMenuLabel>
					{locations.map((loc) => {
						const isActive = !isConsolidated && locationId === loc.id
						return (
							<DropdownMenuItem
								key={loc.id}
								onClick={() => {
									switchTo(loc.id)
									toast.success(`Lokasi aktif: ${loc.name}`, {
										description: `Data difilter ke ${loc.name}.`,
									})
								}}
								className="gap-3 px-3 py-2.5 cursor-pointer"
							>
								<div className="flex size-8 items-center justify-center rounded-lg border bg-card text-foreground font-bold text-xs">
									{loc.name.charAt(0).toUpperCase()}
								</div>
								<div className="flex-1 min-w-0">
									<span className="font-medium truncate block">{loc.name}</span>
									{loc.code && (
										<p className="text-[11px] text-muted-foreground font-mono">{loc.code}</p>
									)}
								</div>
								{isActive && <CheckIcon className="size-4 text-primary shrink-0" />}
							</DropdownMenuItem>
						)
					})}
				</DropdownMenuGroup>

				<DropdownMenuSeparator />
				<div className="px-3 py-2">
					<p className="text-[10px] text-muted-foreground leading-relaxed">
						Data di seluruh halaman akan difilter sesuai lokasi yang Anda pilih.
					</p>
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

/**
 * Detects if current route is a form/create/edit page.
 * On these pages, the location switcher should be locked.
 */
function useIsFormPage(): boolean {
	const pathname = window.location.pathname
	const formPatterns = ['/adjustment', '/transfer', '/create', '/edit']
	return formPatterns.some((p) => pathname.includes(p))
}
