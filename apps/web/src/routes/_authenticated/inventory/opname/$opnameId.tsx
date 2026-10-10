import { createFileRoute } from '@tanstack/react-router'

import { OpnameDetailRoute } from '@/features/inventory/components/opname-views.tsx'

export const Route = createFileRoute('/_authenticated/inventory/opname/$opnameId')({
	component: function OpnameDetailPage() {
		const { opnameId } = Route.useParams()
		return <OpnameDetailRoute id={Number(opnameId)} />
	},
})
