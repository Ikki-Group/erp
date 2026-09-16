import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { isApiError } from '@/lib/api/index.ts'
import { useUnsavedChangesGuard } from '@/lib/form/index.ts'

import { FormPage } from '@/components/shared/form-page.tsx'

import { toast } from '@/components/ui/toast'

import { supplierResource } from '@/features/supplier/api.ts'
import {
	SupplierFormFields,
	useSupplierForm,
} from '@/features/supplier/components/supplier-form.tsx'

export const Route = createFileRoute('/_authenticated/master/suppliers/new')({
	component: NewSupplierPage,
})

function NewSupplierPage() {
	const navigate = useNavigate()
	const createMut = useMutation(supplierResource.create.mutationOptions())

	const form = useSupplierForm({
		onSubmit: async (values) => {
			try {
				await createMut.mutateAsync({
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
					throw new Error('Supplier code already exists. Please use a different code.', {
						cause: err,
					})
				}
				throw err
			}
			toast.add({ title: 'Supplier created successfully.', type: 'success' })
			navigate({ to: '/master/suppliers' })
		},
	})

	useUnsavedChangesGuard(form)

	return (
		<form.AppForm>
			<FormPage
				title="Add Supplier"
				description="Create a new supplier."
				form={form}
				submitLabel="Create"
				onCancel={() => navigate({ to: '/master/suppliers' })}
			>
				<SupplierFormFields form={form} />
			</FormPage>
		</form.AppForm>
	)
}
