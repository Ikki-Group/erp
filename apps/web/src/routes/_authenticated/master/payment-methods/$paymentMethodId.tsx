import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { useUnsavedChangesGuard } from '@/lib/form/index.ts'

import { FormPage } from '@/components/shared/form-page.tsx'
import { PageSkeleton } from '@/components/shared/page-skeleton.tsx'

import { toast } from '@/components/ui/toast'

import { paymentMethodMutations, paymentMethodResource } from '@/features/payment-method/api.ts'
import {
	PaymentMethodFormFields,
	toPaymentMethodFormValues,
	usePaymentMethodForm,
} from '@/features/payment-method/components/payment-method-form.tsx'
import type { PaymentMethodDto } from '@/features/payment-method/dto/index.ts'

export const Route = createFileRoute('/_authenticated/master/payment-methods/$paymentMethodId')({
	component: EditPaymentMethodPage,
})

function EditPaymentMethodPage() {
	const { paymentMethodId } = Route.useParams()
	const navigate = useNavigate()
	const id = Number(paymentMethodId)

	const detailQuery = useQuery(paymentMethodResource.detail.queryOptions({ id }))

	if (detailQuery.isLoading) {
		return <PageSkeleton />
	}

	const method = detailQuery.data?.data
	if (!method) {
		return null
	}

	return (
		<EditPaymentMethodForm
			method={method}
			onDone={() => navigate({ to: '/master/payment-methods' })}
		/>
	)
}

interface EditPaymentMethodFormProps {
	method: PaymentMethodDto
	onDone: () => void
}

function EditPaymentMethodForm({ method, onDone }: EditPaymentMethodFormProps) {
	const updateMut = useMutation(paymentMethodMutations.update.mutationOptions())
	const form = usePaymentMethodForm({
		defaultValues: toPaymentMethodFormValues(method),
		onSubmit: async (values) => {
			await updateMut.mutateAsync({ id: method.id, ...values })
			toast.add({ title: 'Payment method updated.', type: 'success' })
			onDone()
		},
	})

	useUnsavedChangesGuard(form)

	return (
		<form.AppForm>
			<FormPage
				title="Edit Payment Method"
				description={`Update details for ${method.name}.`}
				form={form}
				submitLabel="Save Changes"
				onCancel={onDone}
			>
				<PaymentMethodFormFields form={form} />
			</FormPage>
		</form.AppForm>
	)
}
