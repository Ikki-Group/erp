import { useStore } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { isApiError } from '@/lib/api/index.ts'

import { DetailBoundary } from '@/components/shared/detail-boundary.tsx'
import { EntityEditorPage } from '@/components/shared/entity-editor-page.tsx'
import { PageError } from '@/components/shared/page-error.tsx'
import { usePermissionCheck } from '@/components/shared/permission-gate.tsx'

import { Button } from '@/components/ui/button'

import { companyDetail } from '@/features/company/api.ts'
import { CompanyFormFields, useCompanyForm } from '@/features/company/components/company-form.tsx'
import type { CompanySettingsDto } from '@/features/company/dto/index.ts'

export const Route = createFileRoute('/_authenticated/settings/company/edit')({
	component: CompanySettingsPage,
})

function CompanySettingsPage() {
	const canRead = usePermissionCheck({ permission: 'company.read' })
	const canUpdate = usePermissionCheck({ permission: 'company.update' })
	const detailQuery = useQuery(
		companyDetail.queryOptions({ retry: false, enabled: canRead, throwOnError: false }),
	)

	if (!canRead) {
		return (
			<PageError title="No access" message="You don't have permission to view company settings." />
		)
	}

	return (
		<DetailBoundary
			query={detailQuery}
			error={renderCompanyError}
			notFound={
				<PageError
					title="Company settings not found"
					message="This workspace has no company profile to edit."
				/>
			}
		>
			{(response) => (
				<CompanySettingsForm key={response.data.id} settings={response.data} canWrite={canUpdate} />
			)}
		</DetailBoundary>
	)
}

function renderCompanyError(error: Error, retry: () => void) {
	const missing = isApiError(error) && error.isNotFound
	return (
		<PageError
			title={missing ? 'Company settings not found' : 'Could not load company settings'}
			message={
				missing
					? 'This workspace has no company profile to edit.'
					: 'Try loading the company profile again.'
			}
			onRetry={retry}
		/>
	)
}

function CompanySettingsForm({
	settings,
	canWrite,
}: {
	settings: CompanySettingsDto
	canWrite: boolean
}) {
	const navigate = useNavigate()
	const form = useCompanyForm({
		settings,
		canWrite,
		onSaved: () => navigate({ to: '/settings/company' }),
	})
	const saveFailed = useStore(form.store, (state) => state.errorMap.onSubmit !== undefined)
	const isSubmitting = useStore(form.store, (state) => state.isSubmitting)

	return (
		<EntityEditorPage
			title="Company Settings"
			description="Manage your company profile and tax configuration."
			form={form}
			submitLabel="Save Changes"
			onCancel={() => window.history.back()}
			readOnly={!canWrite}
			actions={
				!canWrite ? (
					<p className="text-xs text-muted-foreground">
						You don&apos;t have permission to edit company settings.
					</p>
				) : saveFailed ? (
					// A failed save blocks the submit button until the next edit; retrying the same values must stay possible.
					<Button
						type="button"
						variant="outline"
						disabled={isSubmitting}
						onClick={() => void form.handleSubmit()}
					>
						Retry save
					</Button>
				) : undefined
			}
		>
			<fieldset disabled={!canWrite} className="contents">
				<CompanyFormFields form={form} />
			</fieldset>
		</EntityEditorPage>
	)
}
