import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { DetailBoundary } from '@/components/shared/detail-boundary.tsx'
import { PageError } from '@/components/shared/page-error.tsx'
import { PageSection } from '@/components/shared/page-section.tsx'
import { PageShell } from '@/components/shared/page-shell.tsx'

import { MyAccessSection } from '@/features/account/components/my-access-section.tsx'
import { PasswordSection } from '@/features/account/components/password-section.tsx'
import { ProfileForm } from '@/features/account/components/profile-form.tsx'
import { SessionsSection } from '@/features/account/components/sessions-section.tsx'
import { authMeQuery } from '@/features/auth/api.ts'

export const Route = createFileRoute('/_authenticated/account')({
	component: AccountPage,
})

function renderAccountError(_error: Error, retry: () => void) {
	return (
		<PageError title="Gagal memuat akun Anda" message="Coba muat akun Anda lagi." onRetry={retry} />
	)
}

function AccountPage() {
	const query = useQuery(authMeQuery.queryOptions({ retry: false, throwOnError: false }))

	return (
		<PageShell
			title="Akun Saya"
			description="Kelola profil, kata sandi, dan perangkat yang masuk."
			className="mx-auto max-w-2xl"
		>
			<DetailBoundary query={query} error={renderAccountError}>
				{(response) => (
					<div className="space-y-8">
						<PageSection title="Profil" description="Tampilan Anda di mata tim.">
							<div className="rounded-lg border p-4">
								<ProfileForm
									key={response.data.user.id}
									profile={response.data.user}
									username={response.data.user.username}
								/>
							</div>
						</PageSection>
						<PageSection
							title="Ubah kata sandi"
							description="Mengubah kata sandi akan mengeluarkan Anda dari perangkat lain."
						>
							<div className="rounded-lg border p-4">
								<PasswordSection />
							</div>
						</PageSection>
						<PageSection title="Sesi aktif" description="Perangkat yang sedang masuk ke akun Anda.">
							<SessionsSection />
						</PageSection>
						<PageSection
							title="Akses saya"
							description="Lokasi kerja Anda dan peran yang Anda miliki."
						>
							<MyAccessSection me={response.data} />
						</PageSection>
					</div>
				)}
			</DetailBoundary>
		</PageShell>
	)
}
