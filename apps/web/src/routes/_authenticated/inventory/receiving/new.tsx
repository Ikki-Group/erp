import { useStore } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { useUnsavedChangesGuard } from '@/lib/form/index.ts'

import { EmptyState } from '@/components/shared/empty-state.tsx'
import { PageHeader } from '@/components/shared/page-header.tsx'
import { WizardPage } from '@/components/shared/wizard-page.tsx'

import { toast } from '@/components/ui/toast'

import { receivingResource } from '@/features/inventory/api.ts'
import {
	ReceivingStepLines,
	ReceivingStepReview,
	ReceivingStepSupplier,
	isReceivingStepValid,
	useReceivingWizard,
} from '@/features/inventory/components/receiving-wizard.tsx'

import { useLocationContext } from '@/providers/location-provider.tsx'

export const Route = createFileRoute('/_authenticated/inventory/receiving/new')({
	component: NewReceivingPage,
})

function NewReceivingPage() {
	const { activeLocation } = useLocationContext()

	if (!activeLocation) {
		return (
			<div className="space-y-6">
				<PageHeader title="Buat Penerimaan" description="Catat penerimaan barang dari supplier." />
				<EmptyState
					title="Pilih lokasi"
					description="Pilih lokasi aktif untuk membuat penerimaan."
				/>
			</div>
		)
	}

	return <NewReceivingWizard locationId={activeLocation.id} />
}

function NewReceivingWizard({ locationId }: { locationId: number }) {
	const navigate = useNavigate()
	const createMut = useMutation(receivingResource.create.mutationOptions())

	const form = useReceivingWizard({
		onSubmit: async (values) => {
			await createMut.mutateAsync({
				locationId,
				supplierId: values.supplierId!,
				notes: values.notes || null,
				lines: values.lines.map((l) => ({
					materialId: l.materialId!,
					qty: l.qty,
					unitCost: l.unitCost,
					uomId: l.uomId!,
				})),
			})
			toast.add({ title: 'Penerimaan berhasil dibuat.', type: 'success' })
			navigate({ to: '/inventory/receiving' })
		},
	})

	useUnsavedChangesGuard(form)

	const values = useStore(form.store, (state) => state.values)

	return (
		<form.AppForm>
			<WizardPage
				title="Buat Penerimaan"
				description="Catat penerimaan barang dari supplier."
				form={form}
				onCancel={() => navigate({ to: '/inventory/receiving' })}
				submitLabel="Simpan Penerimaan"
				steps={[
					{
						title: 'Supplier',
						content: <ReceivingStepSupplier form={form} />,
						isValid: isReceivingStepValid(1, values),
					},
					{
						title: 'Item',
						content: <ReceivingStepLines form={form} />,
						isValid: isReceivingStepValid(2, values),
					},
					{
						title: 'Review',
						content: <ReceivingStepReview form={form} />,
						isValid: true,
					},
				]}
			/>
		</form.AppForm>
	)
}
