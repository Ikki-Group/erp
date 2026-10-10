import { createFileRoute } from '@tanstack/react-router'

import { TransferDetailRoute } from '@/features/inventory/components/transfer-views.tsx'

export const Route = createFileRoute('/_authenticated/inventory/transfers/$transferId')({
	component: function TransferDetailPage() {
		const { transferId } = Route.useParams()
		return <TransferDetailRoute id={Number(transferId)} />
	},
})
