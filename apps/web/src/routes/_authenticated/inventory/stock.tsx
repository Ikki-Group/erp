import { useCallback, useState } from 'react'

import { createFileRoute } from '@tanstack/react-router'

import { BoxesIcon, HistoryIcon, PackageIcon } from 'lucide-react'

import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { PageTabs } from '@/components/shared/page-tabs'
import type { PageTab } from '@/components/shared/page-tabs'

import { MovementHistory } from '@/features/inventory/components/movement-history.tsx'
import { StockTable } from '@/features/inventory/components/stock-table.tsx'
import type { StockBalanceDto } from '@/features/inventory/dto/index.ts'

import { useLocationContext } from '@/providers/location-provider.tsx'

export const Route = createFileRoute('/_authenticated/inventory/stock')({
	component: StockPage,
})

// ─── Tabs ───

const TABS: PageTab[] = [
	{ id: 'balances', label: 'Saldo Stok', icon: <BoxesIcon className="size-3.5" /> },
	{ id: 'movements', label: 'Riwayat Pergerakan', icon: <HistoryIcon className="size-3.5" /> },
]

// ─── Page ───

function StockPage() {
	const { activeLocation } = useLocationContext()
	const [activeTab, setActiveTab] = useState('balances')
	const [selectedMaterial, setSelectedMaterial] = useState<StockBalanceDto | null>(null)

	const handleRowClick = useCallback((balance: StockBalanceDto) => {
		setSelectedMaterial(balance)
		setActiveTab('movements')
	}, [])

	const handleTabChange = useCallback((tabId: string) => {
		setActiveTab(tabId)
		if (tabId === 'balances') {
			setSelectedMaterial(null)
		}
	}, [])

	if (!activeLocation) {
		return (
			<div className="space-y-6">
				<PageHeader
					title="Stok Inventori"
					description="Lihat saldo stok dan riwayat pergerakan barang."
				/>
				<EmptyState
					title="Pilih lokasi"
					description="Pilih lokasi aktif untuk melihat data stok."
					icon={<PackageIcon className="size-5" />}
				/>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<PageHeader
				title="Stok Inventori"
				description={`Saldo stok di ${activeLocation.name}`}
			/>

			<PageTabs tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />

			{activeTab === 'balances' && (
				<StockTable locationId={activeLocation.id} onRowClick={handleRowClick} />
			)}

			{activeTab === 'movements' && selectedMaterial && (
				<div className="space-y-3">
					<p className="text-sm text-muted-foreground">
						Riwayat pergerakan untuk Material #{selectedMaterial.materialId}
					</p>
					<MovementHistory
						materialId={selectedMaterial.materialId}
						locationId={activeLocation.id}
					/>
				</div>
			)}

			{activeTab === 'movements' && !selectedMaterial && (
				<EmptyState
					title="Pilih material"
					description="Klik baris di tabel saldo stok untuk melihat riwayat pergerakan."
					icon={<HistoryIcon className="size-5" />}
				/>
			)}
		</div>
	)
}
