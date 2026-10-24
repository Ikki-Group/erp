import { createFileRoute } from '@tanstack/react-router'

import { Page } from '@/components/layout/page'

import { MaterialAssignToLocationDialog, MaterialTable } from '@/features/material'

export const Route = createFileRoute('/_app/material/')({ component: RouteComponent })

function RouteComponent() {
	return (
		<Page size="full">
			<MaterialAssignToLocationDialog.Root />
			<Page.BlockHeader
				title="Bahan Baku"
				description="Kelola daftar bahan mentah dan bahan setengah jadi untuk proses produksi, pengaturan satuan (UOM), serta penempatan lokasi penyimpanan."
			/>
			<Page.Content>
				<MaterialTable />
			</Page.Content>
		</Page>
	)
}
