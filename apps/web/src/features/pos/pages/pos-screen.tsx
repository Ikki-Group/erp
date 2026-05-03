import { useState } from 'react'

import { OutletSelectionDialog } from '@/components/blocks/pos/outlet-selection-dialog'

import type { LocationDto } from '@/features/location'

export function PosScreen() {
	const [selectedOutlet, setSelectedOutlet] = useState<LocationDto | null>(null)
	const [showOutletDialog, setShowOutletDialog] = useState(true)

	const handleSelectOutlet = (outlet: LocationDto) => {
		setSelectedOutlet(outlet)
		setShowOutletDialog(false)
	}

	return (
		<>
			<OutletSelectionDialog
				open={showOutletDialog}
				onOpenChange={setShowOutletDialog}
				onSelect={handleSelectOutlet}
			/>
			{selectedOutlet ? (
				<div className="flex h-full items-center justify-center">
					<p className="text-muted-foreground">
						POS Screen for: {selectedOutlet.name}
					</p>
				</div>
			) : (
				<div className="flex h-full items-center justify-center">
					<p className="text-muted-foreground">Silakan pilih outlet terlebih dahulu</p>
				</div>
			)}
		</>
	)
}
