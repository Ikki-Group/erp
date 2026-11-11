import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { EntityEditorPage } from '@/components/shared/entity-editor-page'

import { MaterialFormFields, useMaterialForm } from '@/features/material/components/material-form'

export const Route = createFileRoute('/_authenticated/master/materials/new')({
	component: NewMaterialPage,
})

function NewMaterialPage() {
	const navigate = useNavigate()
	const onDone = () => navigate({ to: '/master/materials' })
	const form = useMaterialForm({ onSaved: onDone })

	return (
		<EntityEditorPage
			title="Add Material"
			description="Create a new material."
			form={form}
			submitLabel="Create"
			onCancel={onDone}
		>
			<MaterialFormFields form={form} />
		</EntityEditorPage>
	)
}
