import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { AuditTrail } from '@/components/shared/audit-trail.tsx'
import { DetailBoundary } from '@/components/shared/detail-boundary.tsx'
import { EntityEditorPage } from '@/components/shared/entity-editor-page'
import { PageSection } from '@/components/shared/page-section.tsx'
import { usePermissionCheck } from '@/components/shared/permission-gate.tsx'

import { auditResource } from '@/features/audit/api.ts'
import { materialResource } from '@/features/material/api.ts'
import {
	MaterialFormFields,
	useMaterialForm,
} from '@/features/material/components/material-form.tsx'
import type { MaterialDto } from '@/features/material/dto/index.ts'

export const Route = createFileRoute('/_authenticated/master/materials/$materialId')({
	component: EditMaterialPage,
})

function EditMaterialPage() {
	const { materialId } = Route.useParams()
	const navigate = useNavigate()
	const id = Number(materialId)

	const detailQuery = useQuery(
		materialResource.detail.queryOptions({ id }, { throwOnError: false }),
	)

	return (
		<DetailBoundary query={detailQuery}>
			{(response) => (
				<EditMaterialForm
					key={response.data.id}
					material={response.data}
					onDone={() => navigate({ to: '/master/materials' })}
				/>
			)}
		</DetailBoundary>
	)
}

interface EditMaterialFormProps {
	material: MaterialDto
	onDone: () => void
}

/** Mount an editing session only once the requested entity has loaded. */
function EditMaterialForm({ material, onDone }: EditMaterialFormProps) {
	const canReadAudit = usePermissionCheck({ permission: 'audit.read' })
	const auditQuery = useQuery({
		...auditResource.byEntity.queryOptions({ entity: 'material', entityId: material.id }),
		enabled: canReadAudit,
	})

	const form = useMaterialForm({ material, onSaved: onDone })

	return (
		<EntityEditorPage
			title="Edit Material"
			description={`Update details for ${material.name}.`}
			form={form}
			submitLabel="Save Changes"
			onCancel={onDone}
		>
			<MaterialFormFields form={form} />

			{canReadAudit && (
				<PageSection title="Activity" description="Recent changes to this material.">
					<AuditTrail
						entries={auditQuery.data?.data ?? []}
						isLoading={auditQuery.isLoading}
						emptyMessage="No changes recorded for this material yet."
					/>
				</PageSection>
			)}
		</EntityEditorPage>
	)
}
