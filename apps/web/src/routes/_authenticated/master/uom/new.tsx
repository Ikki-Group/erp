import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { EntityEditorPage } from '@/components/shared/entity-editor-page.tsx'

import { UomFormFields, useUomForm } from '@/features/uom/components/uom-form.tsx'

export const Route = createFileRoute('/_authenticated/master/uom/new')({
	component: NewUomPage,
})

function NewUomPage() {
	const navigate = useNavigate()
	const onDone = () => navigate({ to: '/master/uom' })
	const form = useUomForm({ onSaved: onDone })

	return (
		<EntityEditorPage
			title="Add Unit"
			description="Create a new unit of measure."
			form={form}
			submitLabel="Create"
			onCancel={onDone}
		>
			<UomFormFields form={form} />
		</EntityEditorPage>
	)
}
