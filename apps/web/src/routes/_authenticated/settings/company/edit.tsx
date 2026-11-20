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

const COMPANY_NOT_FOUND = {
	title: 'Pengaturan perusahaan tidak ditemukan',
	message: 'Ruang kerja ini belum memiliki profil perusahaan untuk diubah.',
}

function CompanySettingsPage() {
	const canRead = usePermissionCheck({ permission: 'company.read' })
	const canUpdate = usePermissionCheck({ permission: 'company.update' })
	const detailQuery = useQuery(
		companyDetail.queryOptions({ retry: false, enabled: canRead, throwOnError: false }),
	)

	if (!canRead) {
		return (
			<PageError
				title="Tidak ada akses"
				message="Anda tidak memiliki izin untuk melihat pengaturan perusahaan."
			/>
		)
	}

	return (
		<DetailBoundary
			query={detailQuery}
			error={renderCompanyError}
			notFound={<PageError {...COMPANY_NOT_FOUND} />}
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
			title={missing ? COMPANY_NOT_FOUND.title : 'Gagal memuat pengaturan perusahaan'}
			message={missing ? COMPANY_NOT_FOUND.message : 'Coba muat profil perusahaan lagi.'}
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
			title="Pengaturan Perusahaan"
			description="Kelola profil perusahaan dan konfigurasi pajak Anda."
			form={form}
			submitLabel="Simpan Perubahan"
			onCancel={() => window.history.back()}
			readOnly={!canWrite}
			actions={
				!canWrite ? (
					<p className="text-xs text-muted-foreground">
						Anda tidak memiliki izin untuk mengubah pengaturan perusahaan.
					</p>
				) : saveFailed ? (
					// A failed save blocks the submit button until the next edit; retrying the same values must stay possible.
					<Button
						type="button"
						variant="outline"
						disabled={isSubmitting}
						onClick={() => void form.handleSubmit()}
					>
						Coba lagi simpan
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
