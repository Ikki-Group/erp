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
			title="Tambah Pemasok"
			description="Buat pemasok baru."
			form={form}
			submitLabel="Buat"
			onCancel={onDone}
		>
			<SupplierFormFields form={form} />
		</EntityEditorPage>
	)
}
