import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { useUnsavedChangesGuard } from '@/lib/form/index.ts'

import { DetailBoundary } from '@/components/shared/detail-boundary.tsx'
import { FormPage } from '@/components/shared/form-page.tsx'

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

	return (
		<DetailBoundary query={detailQuery}>
			{(response) => (
				<EditPaymentMethodForm
					method={response.data}
					onDone={() => navigate({ to: '/master/payment-methods' })}
				/>
			)}
		</DetailBoundary>
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
