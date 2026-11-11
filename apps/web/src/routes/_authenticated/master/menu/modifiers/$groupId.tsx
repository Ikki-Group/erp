import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { DetailBoundary } from '@/components/shared/detail-boundary.tsx'
import { PageError } from '@/components/shared/page-error.tsx'
import { usePermissionCheck } from '@/components/shared/permission-gate.tsx'

import { modifierGroupResource } from '@/features/menu/api.ts'
import { ModifierGroupEditorPage } from '@/features/menu/components/modifier-group-editor-page.tsx'

export const Route = createFileRoute('/_authenticated/master/menu/modifiers/$groupId')({
	component: EditModifierGroupPage,
})

function EditModifierGroupPage() {
	const { groupId } = Route.useParams()
	const canRead = usePermissionCheck({ permission: 'modifier.read' })
	const query = useQuery(
		modifierGroupResource.detail.queryOptions(
			{ id: Number(groupId) },
			{ enabled: canRead, throwOnError: false },
		),
	)
	if (!canRead)
		return (
			<PageError
				title="Tidak ada akses"
				message="Anda tidak memiliki izin melihat modifier group."
			/>
		)

	return (
		<DetailBoundary query={query}>
			{(response) => <ModifierGroupEditorPage key={response.data.id} group={response.data} />}
		</DetailBoundary>
	)
}
