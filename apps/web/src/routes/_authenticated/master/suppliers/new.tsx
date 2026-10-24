import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { EntityEditorPage } from '@/components/shared/entity-editor-page'

import { SupplierFormFields, useSupplierForm } from '@/features/supplier/components/supplier-form'

export const Route = createFileRoute('/_authenticated/master/suppliers/new')({
	component: NewSupplierPage,
})

function NewSupplierPage() {
	const navigate = useNavigate()
	const onDone = () => navigate({ to: '/master/suppliers' })
	const form = useSupplierForm({ onSaved: onDone })

	return (
		<EntityEditorPage
			title="Add Supplier"
			description="Create a new supplier."
			form={form}
			submitLabel="Create"
			onCancel={onDone}
		>
			<SupplierFormFields form={form} />
		</EntityEditorPage>
	)
}
