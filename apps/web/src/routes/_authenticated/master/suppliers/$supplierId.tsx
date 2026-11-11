import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { DetailBoundary } from '@/components/shared/detail-boundary.tsx'
import { EntityEditorPage } from '@/components/shared/entity-editor-page'

import { supplierResource } from '@/features/supplier/api.ts'
import {
	SupplierFormFields,
	useSupplierForm,
} from '@/features/supplier/components/supplier-form.tsx'
import type { SupplierDto } from '@/features/supplier/dto/index.ts'

export const Route = createFileRoute('/_authenticated/master/suppliers/$supplierId')({
	component: EditSupplierPage,
})

function EditSupplierPage() {
	const { supplierId } = Route.useParams()
	const navigate = useNavigate()
	const id = Number(supplierId)

	const detailQuery = useQuery(
		supplierResource.detail.queryOptions({ id }, { throwOnError: false }),
	)

	return (
		<DetailBoundary query={detailQuery}>
			{(response) => (
				<EditSupplierForm
					key={response.data.id}
					supplier={response.data}
					onDone={() => navigate({ to: '/master/suppliers' })}
				/>
			)}
		</DetailBoundary>
	)
}

interface EditSupplierFormProps {
	supplier: SupplierDto
	onDone: () => void
}

function EditSupplierForm({ supplier, onDone }: EditSupplierFormProps) {
	const form = useSupplierForm({ supplier, onSaved: onDone })

	return (
		<EntityEditorPage
			title="Edit Supplier"
			description={`Update details for ${supplier.name}.`}
			form={form}
			submitLabel="Save Changes"
			onCancel={onDone}
		>
			<SupplierFormFields form={form} />
		</EntityEditorPage>
	)
}
