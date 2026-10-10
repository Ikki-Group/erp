import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { PackageIcon } from 'lucide-react'

import { EmptyState } from '@/components/shared/empty-state'
import { PageShell } from '@/components/shared/page-shell'

import { documentListSearchSchema } from '@/features/inventory/components/document-shared.tsx'
import { ReceivingListPage } from '@/features/inventory/components/receiving-views.tsx'
import { ReceivingStatusEnum } from '@/features/inventory/dto/index.ts'

import { useLocationContext } from '@/providers/location-provider.tsx'

export const Route = createFileRoute('/_authenticated/inventory/receiving/')({
	validateSearch: documentListSearchSchema.extend({ status: ReceivingStatusEnum.optional() }),
	component: ReceivingPage,
})

function ReceivingPage() {
	const { activeLocation } = useLocationContext()
	const navigate = useNavigate({ from: Route.fullPath })
	const search = Route.useSearch()

	if (!activeLocation) {
		return (
			<PageShell title="Penerimaan Barang" description="Catat penerimaan barang dari supplier.">
				<EmptyState
					title="Pilih lokasi"
					description="Pilih lokasi aktif untuk melihat data penerimaan."
					icon={<PackageIcon className="size-5" />}
				/>
			</PageShell>
		)
	}
	return (
		<ReceivingListPage
			locationId={activeLocation.id}
			locationName={activeLocation.name}
			search={search}
			onSearchChange={(next) => navigate({ search: next })}
		/>
	)
}
