import { useState } from 'react'

import { OutletSelectionDialog } from '@/components/blocks/pos/outlet-selection-dialog'
import { SalesModeSelector } from '@/components/blocks/pos/sales-mode-selector'

import type { LocationDto } from '@/features/location'
import type { SalesTypeDto } from '@/features/sales-type'

export function PosScreen() {
	const [selectedOutlet, setSelectedOutlet] = useState<LocationDto | null>(null)
	const [selectedSalesMode, setSelectedSalesMode] = useState<SalesTypeDto | null>(null)
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
				<div className="flex h-full flex-col gap-4 p-6">
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-2">
							<span className="text-sm text-muted-foreground">Outlet:</span>
							<span className="font-semibold">{selectedOutlet.name}</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-sm text-muted-foreground">Mode:</span>
							<SalesModeSelector selectedMode={selectedSalesMode} onSelect={setSelectedSalesMode} />
						</div>
					</div>
					<div className="flex-1 flex items-center justify-center">
						<p className="text-muted-foreground">
							POS Screen for: {selectedOutlet.name}
							{selectedSalesMode && ` (${selectedSalesMode.name})`}
						</p>
					</div>
				</div>
			) : (
				<div className="flex h-full items-center justify-center">
					<p className="text-muted-foreground">Silakan pilih outlet terlebih dahulu</p>
				</div>
			)}
		</>
	)
}
