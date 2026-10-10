import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { PackageIcon } from 'lucide-react'

import { EmptyState } from '@/components/shared/empty-state'
import { PageShell } from '@/components/shared/page-shell'

import { documentListSearchSchema } from '@/features/inventory/components/document-shared.tsx'
import { TransferListPage } from '@/features/inventory/components/transfer-views.tsx'
import { TransferStatusEnum } from '@/features/inventory/dto/index.ts'

import { useLocationContext } from '@/providers/location-provider.tsx'

export const Route = createFileRoute('/_authenticated/inventory/transfers/')({
	validateSearch: documentListSearchSchema.extend({ status: TransferStatusEnum.optional() }),
	component: TransfersPage,
})

function TransfersPage() {
	const { activeLocation } = useLocationContext()
	const navigate = useNavigate({ from: Route.fullPath })
	const search = Route.useSearch()

	if (!activeLocation) {
		return (
			<PageShell title="Transfer Inventori" description="Transfer bahan baku antar lokasi.">
				<EmptyState
					title="Pilih lokasi"
					description="Pilih lokasi aktif untuk melihat data transfer."
					icon={<PackageIcon className="size-5" />}
				/>
			</PageShell>
		)
	}
	return (
		<TransferListPage
			locationId={activeLocation.id}
			locationName={activeLocation.name}
			search={search}
			onSearchChange={(next) => navigate({ search: next })}
		/>
	)
}
