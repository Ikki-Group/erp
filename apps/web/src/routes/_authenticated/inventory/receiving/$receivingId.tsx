import { createFileRoute } from '@tanstack/react-router'

import { ReceivingDetailRoute } from '@/features/inventory/components/receiving-views.tsx'

export const Route = createFileRoute('/_authenticated/inventory/receiving/$receivingId')({
	component: function ReceivingDetailPage() {
		const { receivingId } = Route.useParams()
		return <ReceivingDetailRoute id={Number(receivingId)} />
	},
})
