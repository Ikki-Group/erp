import { useStore } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { useUnsavedChangesGuard } from '@/lib/form/index.ts'

import { EmptyState } from '@/components/shared/empty-state.tsx'
import { PageHeader } from '@/components/shared/page-header.tsx'
import { WizardPage } from '@/components/shared/wizard-page.tsx'

import { toast } from '@/components/ui/toast'

import { transferResource } from '@/features/inventory/api.ts'
import {
	TransferStepLines,
	TransferStepLocations,
	TransferStepReview,
	isTransferStepValid,
	makeEmptyTransferWizardValues,
	useTransferWizard,
} from '@/features/inventory/components/transfer-wizard.tsx'

import { useLocationContext } from '@/providers/location-provider.tsx'

export const Route = createFileRoute('/_authenticated/inventory/transfers/new')({
	component: NewTransferPage,
})

function NewTransferPage() {
	const { activeLocation } = useLocationContext()

	if (!activeLocation) {
		return (
			<div className="space-y-6">
				<PageHeader
					title="Buat Transfer"
					description="Buat permintaan transfer bahan antar lokasi."
				/>
				<EmptyState title="Pilih lokasi" description="Pilih lokasi aktif untuk membuat transfer." />
			</div>
		)
	}

	return <NewTransferWizard fromLocationId={activeLocation.id} />
}

function NewTransferWizard({ fromLocationId }: { fromLocationId: number }) {
	const navigate = useNavigate()
	const createMut = useMutation(transferResource.create.mutationOptions())

	const form = useTransferWizard({
		defaultValues: makeEmptyTransferWizardValues(fromLocationId),
		onSubmit: async (values) => {
			await createMut.mutateAsync({
				fromLocationId: values.fromLocationId!,
				toLocationId: values.toLocationId!,
				notes: values.notes || null,
				lines: values.lines.map((l) => ({
					materialId: l.materialId!,
					qty: l.qty,
					uomId: l.uomId!,
				})),
			})
			toast.add({ title: 'Transfer berhasil dibuat.', type: 'success' })
			navigate({ to: '/inventory/transfers' })
		},
	})

	useUnsavedChangesGuard(form)

	const values = useStore(form.store, (state) => state.values)

	return (
		<form.AppForm>
			<WizardPage
				title="Buat Transfer"
				description="Buat permintaan transfer bahan antar lokasi."
				form={form}
				onCancel={() => navigate({ to: '/inventory/transfers' })}
				submitLabel="Buat Transfer"
				steps={[
					{
						title: 'Lokasi',
						content: <TransferStepLocations form={form} fromLocationLocked />,
						isValid: isTransferStepValid(1, values),
					},
					{
						title: 'Item',
						content: <TransferStepLines form={form} />,
						isValid: isTransferStepValid(2, values),
					},
					{
						title: 'Review',
						content: <TransferStepReview form={form} />,
						isValid: true,
					},
				]}
			/>
		</form.AppForm>
	)
}
