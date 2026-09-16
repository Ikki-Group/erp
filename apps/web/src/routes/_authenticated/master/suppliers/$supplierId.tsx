import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { isApiError } from '@/lib/api/index.ts'
import { useUnsavedChangesGuard } from '@/lib/form/index.ts'

import { FormPage } from '@/components/shared/form-page.tsx'
import { PageSkeleton } from '@/components/shared/page-skeleton.tsx'

import { toast } from '@/components/ui/toast'

import { supplierResource } from '@/features/supplier/api.ts'
import {
	SupplierFormFields,
	toSupplierFormValues,
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

	const detailQuery = useQuery(supplierResource.detail.queryOptions({ id }))

	if (detailQuery.isLoading) {
		return <PageSkeleton />
	}

	const supplier = detailQuery.data?.data
	if (!supplier) {
		return null
	}

	return (
		<EditSupplierForm supplier={supplier} onDone={() => navigate({ to: '/master/suppliers' })} />
	)
}

interface EditSupplierFormProps {
	supplier: SupplierDto
	onDone: () => void
}

function EditSupplierForm({ supplier, onDone }: EditSupplierFormProps) {
	const updateMut = useMutation(supplierResource.update.mutationOptions())
	const form = useSupplierForm({
		defaultValues: toSupplierFormValues(supplier),
		onSubmit: async (values) => {
			try {
				await updateMut.mutateAsync({
					id: supplier.id,
					code: values.code,
					name: values.name,
					contactPerson: values.contactPerson || null,
					phone: values.phone || null,
					email: values.email || null,
					address: values.address || null,
					paymentTerms: values.paymentTerms ? Number(values.paymentTerms) : null,
					isActive: values.isActive,
				})
			} catch (err) {
				if (isApiError(err) && err.status === 409) {
					throw new Error('Supplier code already exists. Please use a different code.')
				}
				throw err
			}
			toast.add({ title: 'Supplier updated successfully.', type: 'success' })
			onDone()
		},
	})

	useUnsavedChangesGuard(form)

	return (
		<form.AppForm>
			<FormPage
				title="Edit Supplier"
				description={`Update details for ${supplier.name}.`}
				form={form}
				submitLabel="Save Changes"
				onCancel={onDone}
			>
				<SupplierFormFields form={form} />
			</FormPage>
		</form.AppForm>
	)
}
