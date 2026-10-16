import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { DetailBoundary } from '@/components/shared/detail-boundary.tsx'
import { EntityEditorPage } from '@/components/shared/entity-editor-page.tsx'

import { uomResource } from '@/features/uom/api.ts'
import { UomFormFields, useUomForm } from '@/features/uom/components/uom-form.tsx'
import type { UomDto } from '@/features/uom/dto/index.ts'

export const Route = createFileRoute('/_authenticated/master/uom/$uomId')({
	component: EditUomPage,
})

function EditUomPage() {
	const { uomId } = Route.useParams()
	const navigate = useNavigate()
	const id = Number(uomId)

	const detailQuery = useQuery({
		...uomResource.detail.queryOptions({ id }),
		throwOnError: false,
	})

	return (
		<DetailBoundary query={detailQuery}>
			{(response) => (
				<EditUomForm
					key={response.data.id}
					unit={response.data}
					onDone={() => navigate({ to: '/master/uom' })}
				/>
			)}
		</DetailBoundary>
	)
}

interface EditUomFormProps {
	unit: UomDto
	onDone: () => void
}

function EditUomForm({ unit, onDone }: EditUomFormProps) {
	const form = useUomForm({ unit, onSaved: onDone })

	return (
		<EntityEditorPage
			title="Edit Unit"
			description={`Update details for ${unit.name}.`}
			form={form}
			submitLabel="Save Changes"
			onCancel={onDone}
		>
			<UomFormFields form={form} />
		</EntityEditorPage>
	)
}
