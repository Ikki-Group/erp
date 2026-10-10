import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { ClipboardListIcon } from 'lucide-react'

import { EmptyState } from '@/components/shared/empty-state'
import { PageShell } from '@/components/shared/page-shell'

import { documentListSearchSchema } from '@/features/inventory/components/document-shared.tsx'
import { OpnameListPage } from '@/features/inventory/components/opname-views.tsx'
import { OpnameStatusEnum } from '@/features/inventory/dto/index.ts'

import { useLocationContext } from '@/providers/location-provider.tsx'

export const Route = createFileRoute('/_authenticated/inventory/opname/')({
	validateSearch: documentListSearchSchema.extend({ status: OpnameStatusEnum.optional() }),
	component: OpnamePage,
})

function OpnamePage() {
	const { activeLocation } = useLocationContext()
	const navigate = useNavigate({ from: Route.fullPath })
	const search = Route.useSearch()

	if (!activeLocation) {
		return (
			<PageShell
				title="Stock Opname"
				description="Hitung fisik stok dan bandingkan dengan stok sistem."
			>
				<EmptyState
					title="Pilih lokasi"
					description="Pilih lokasi aktif untuk memulai opname."
					icon={<ClipboardListIcon className="size-5" />}
				/>
			</PageShell>
		)
	}
	return (
		<OpnameListPage
			locationId={activeLocation.id}
			locationName={activeLocation.name}
			search={search}
			onSearchChange={(next) => navigate({ search: next })}
		/>
	)
}
