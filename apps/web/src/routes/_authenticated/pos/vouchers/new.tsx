import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { useUnsavedChangesGuard } from '@/lib/form/index.ts'

import { FormPage } from '@/components/shared/form-page.tsx'

import { toast } from '@/components/ui/toast'

import { voucherResource } from '@/features/pos/api.ts'
import { VoucherFormFields, useVoucherForm } from '@/features/pos/components/voucher-form.tsx'

export const Route = createFileRoute('/_authenticated/pos/vouchers/new')({
	component: NewVoucherPage,
})

function NewVoucherPage() {
	const navigate = useNavigate()
	const createMut = useMutation(voucherResource.create.mutationOptions())

	const form = useVoucherForm({
		onSubmit: async (values) => {
			await createMut.mutateAsync({
				code: values.code,
				name: values.name,
				type: values.type,
				value: values.value,
				minPurchase: values.minPurchase || null,
				maxDiscount: values.maxDiscount || null,
				validFrom: values.validFrom!,
				validUntil: values.validUntil!,
				usageLimit: values.usageLimit ? Number(values.usageLimit) : null,
				isActive: values.isActive,
			})
			toast.add({ title: 'Voucher created.', type: 'success' })
			navigate({ to: '/pos/vouchers' })
		},
	})

	useUnsavedChangesGuard(form)

	return (
		<form.AppForm>
			<FormPage
				title="Add Voucher"
				description="Create a new discount voucher."
				form={form}
				submitLabel="Create"
				onCancel={() => navigate({ to: '/pos/vouchers' })}
			>
				<VoucherFormFields form={form} />
			</FormPage>
		</form.AppForm>
	)
}
