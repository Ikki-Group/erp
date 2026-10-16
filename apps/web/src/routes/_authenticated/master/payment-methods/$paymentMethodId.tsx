import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { DetailBoundary } from '@/components/shared/detail-boundary.tsx'
import { usePermissionCheck } from '@/components/shared/permission-gate.tsx'

import { paymentMethodResource } from '@/features/payment-method/api.ts'
import { PaymentMethodEditor } from '@/features/payment-method/components/payment-method-editor.tsx'

export const Route = createFileRoute('/_authenticated/master/payment-methods/$paymentMethodId')({
	component: EditPaymentMethodPage,
})

function EditPaymentMethodPage() {
	const { paymentMethodId } = Route.useParams()
	const navigate = useNavigate()
	const canUpdate = usePermissionCheck({ permission: 'payment-method.update' })
	const id = Number(paymentMethodId)

	const detailQuery = useQuery(
		paymentMethodResource.detail.queryOptions({ id }, { throwOnError: false }),
	)

	return (
		<DetailBoundary query={detailQuery}>
			{(response) => (
				<PaymentMethodEditor
					key={response.data.id}
					method={response.data}
					canWrite={canUpdate}
					onDone={() => navigate({ to: '/master/payment-methods' })}
				/>
			)}
		</DetailBoundary>
	)
}
