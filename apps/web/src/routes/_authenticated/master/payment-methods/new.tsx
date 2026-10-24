import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { usePermissionCheck } from '@/components/shared/permission-gate.tsx'

import { PaymentMethodEditor } from '@/features/payment-method/components/payment-method-editor.tsx'

export const Route = createFileRoute('/_authenticated/master/payment-methods/new')({
	component: NewPaymentMethodPage,
})

function NewPaymentMethodPage() {
	const navigate = useNavigate()
	const canCreate = usePermissionCheck({ permission: 'payment-method.create' })

	return (
		<PaymentMethodEditor
			canWrite={canCreate}
			onDone={() => navigate({ to: '/master/payment-methods' })}
		/>
	)
}
