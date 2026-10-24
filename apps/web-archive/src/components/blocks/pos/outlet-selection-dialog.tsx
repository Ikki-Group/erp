import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'

import { locationApi } from '@/features/location'
import type { LocationDto } from '@/features/location'

interface OutletSelectionDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	onSelect: (outlet: LocationDto) => void
}

export function OutletSelectionDialog({
	open,
	onOpenChange,
	onSelect,
}: OutletSelectionDialogProps) {
	const { data: locationsData, isLoading } = useQuery(locationApi.list.query({}))
	const locations = locationsData?.data ?? []

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Pilih Outlet</DialogTitle>
					<DialogDescription>
						Pilih outlet tempat Anda akan melakukan transaksi POS hari ini.
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					{isLoading ? (
						<div className="flex items-center justify-center py-8 text-muted-foreground">
							Memuat outlet...
						</div>
					) : locations.length === 0 ? (
						<div className="flex items-center justify-center py-8 text-muted-foreground">
							Tidak ada outlet tersedia
						</div>
					) : (
						<div className="grid gap-2">
							{locations.map((location) => (
								<Button
									key={location.id}
									variant="outline"
									className="justify-start"
									onClick={() => onSelect(location)}
								>
									<div className="flex flex-col items-start">
										<span className="font-semibold">{location.name}</span>
										{location.address && (
											<span className="text-xs text-muted-foreground">{location.address}</span>
										)}
									</div>
								</Button>
							))}
						</div>
					)}
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Batal
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
