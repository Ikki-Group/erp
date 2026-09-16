import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { useUnsavedChangesGuard } from '@/lib/form/index.ts'

import { FormPage } from '@/components/shared/form-page.tsx'
import { PageSkeleton } from '@/components/shared/page-skeleton.tsx'
import { usePermissionCheck } from '@/components/shared/permission-gate.tsx'

import { toast } from '@/components/ui/toast'

import { companyCreate, companyDetail, companyUpdate } from '@/features/company/api.ts'
import { CompanyFormFields, useCompanyForm } from '@/features/company/components/company-form.tsx'
import type { CompanyFormValues } from '@/features/company/components/company-form.tsx'
import type { CompanySettingsDto } from '@/features/company/dto/index.ts'

export const Route = createFileRoute('/_authenticated/settings/company')({
	component: CompanySettingsPage,
})

function toFormValues(data: CompanySettingsDto): CompanyFormValues {
	return {
		name: data.name ?? '',
		address: data.address ?? '',
		phone: data.phone ?? '',
		email: data.email ?? '',
		taxId: data.taxId ?? '',
		taxRate: data.taxRate ?? '0',
		currencyCode: data.currencyCode ?? 'IDR',
		currencySymbol: data.currencySymbol ?? 'Rp',
		receiptFooter: data.receiptFooter ?? '',
	}
}

function CompanySettingsPage() {
	const detailQuery = useQuery(companyDetail.queryOptions({ retry: false }))

	if (detailQuery.isLoading) {
		return <PageSkeleton />
	}

	return <CompanySettingsForm existing={detailQuery.data?.data} />
}

interface CompanySettingsFormProps {
	existing?: CompanySettingsDto
}

function CompanySettingsForm({ existing }: CompanySettingsFormProps) {
	const isCreate = !existing
	const canWrite = usePermissionCheck({ permission: 'company.update' })
	const createMut = useMutation(companyCreate.mutationOptions())
	const updateMut = useMutation(companyUpdate.mutationOptions())

	const form = useCompanyForm({
		defaultValues: existing ? toFormValues(existing) : undefined,
		onSubmit: async (values) => {
			const payload = {
				name: values.name,
				address: values.address || null,
				phone: values.phone || null,
				email: values.email || null,
				taxId: values.taxId || null,
				taxRate: values.taxRate,
				currencyCode: values.currencyCode,
				currencySymbol: values.currencySymbol,
				receiptFooter: values.receiptFooter || null,
			}

			if (isCreate) {
				await createMut.mutateAsync(payload)
				toast.add({ title: 'Company settings created.', type: 'success' })
			} else {
				await updateMut.mutateAsync({ ...payload, id: existing.id })
				toast.add({ title: 'Company settings updated.', type: 'success' })
			}
		},
	})

	useUnsavedChangesGuard(form)

	return (
		<form.AppForm>
			<FormPage
				title="Company Settings"
				description="Manage your company profile and tax configuration."
				form={form}
				submitLabel={isCreate ? 'Create' : 'Save Changes'}
				onCancel={() => window.history.back()}
				actions={
					!canWrite ? (
						<p className="text-xs text-muted-foreground">
							You don&apos;t have permission to edit company settings.
						</p>
					) : undefined
				}
			>
				<fieldset disabled={!canWrite} className="contents">
					<CompanyFormFields form={form} />
				</fieldset>
			</FormPage>
		</form.AppForm>
	)
}
