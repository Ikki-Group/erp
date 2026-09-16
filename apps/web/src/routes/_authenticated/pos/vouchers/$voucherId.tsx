import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { FormPage } from '@/components/shared/form-page.tsx'
import { PageSkeleton } from '@/components/shared/page-skeleton.tsx'

import { toast } from '@/components/ui/toast'

import { useUnsavedChangesGuard } from '@/lib/form/index.ts'

import { voucherResource } from '@/features/pos/api.ts'
import {
	VoucherFormFields,
	toVoucherFormValues,
	useVoucherForm,
} from '@/features/pos/components/voucher-form.tsx'
import type { VoucherDto } from '@/features/pos/dto/index.ts'

export const Route = createFileRoute('/_authenticated/pos/vouchers/$voucherId')({
	component: EditVoucherPage,
})

function EditVoucherPage() {
	const { voucherId } = Route.useParams()
	const navigate = useNavigate()
	const id = Number(voucherId)

	const detailQuery = useQuery(voucherResource.detail.queryOptions({ id }))

	if (detailQuery.isLoading) {
		return <PageSkeleton />
	}

	const voucher = detailQuery.data?.data
	if (!voucher) {
		return null
	}

	return <EditVoucherForm voucher={voucher} onDone={() => navigate({ to: '/pos/vouchers' })} />
}

interface EditVoucherFormProps {
	voucher: VoucherDto
	onDone: () => void
}

function EditVoucherForm({ voucher, onDone }: EditVoucherFormProps) {
	const updateMut = useMutation(voucherResource.update.mutationOptions())
	const form = useVoucherForm({
		defaultValues: toVoucherFormValues(voucher),
		onSubmit: async (values) => {
			await updateMut.mutateAsync({
				id: voucher.id,
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
			toast.add({ title: 'Voucher updated.', type: 'success' })
			onDone()
		},
	})

	useUnsavedChangesGuard(form)

	return (
		<form.AppForm>
			<FormPage
				title="Edit Voucher"
				description={`Update details for ${voucher.code}.`}
				form={form}
				submitLabel="Save Changes"
				onCancel={onDone}
			>
				<VoucherFormFields form={form} />
			</FormPage>
		</form.AppForm>
	)
}
