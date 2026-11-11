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
		<PageError
			title="Could not load your account"
			message="Try loading your account again."
			onRetry={retry}
		/>
	)
}

function AccountPage() {
	const query = useQuery(authMeQuery.queryOptions({ retry: false, throwOnError: false }))

	return (
		<PageShell
			title="My Account"
			description="Manage your profile, password and signed-in devices."
			className="mx-auto max-w-2xl"
		>
			<DetailBoundary query={query} error={renderAccountError}>
				{(response) => (
					<div className="space-y-8">
						<PageSection title="Profile" description="How you appear to your team.">
							<div className="rounded-lg border p-4">
								<ProfileForm
									key={response.data.user.id}
									profile={response.data.user}
									username={response.data.user.username}
								/>
							</div>
						</PageSection>
						<PageSection
							title="Change password"
							description="Changing your password signs you out everywhere else."
						>
							<div className="rounded-lg border p-4">
								<PasswordSection />
							</div>
						</PageSection>
						<PageSection
							title="Active sessions"
							description="Devices currently signed in to your account."
						>
							<SessionsSection />
						</PageSection>
						<PageSection title="My access" description="Where you can work and in which role.">
							<MyAccessSection me={response.data} />
						</PageSection>
					</div>
				)}
			</DetailBoundary>
		</PageShell>
	)
}
