import { useState } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'

import { MonitorIcon } from 'lucide-react'

import { isApiError } from '@/lib/api/index.ts'

import { confirm } from '@/components/shared/confirm.tsx'
import { DetailBoundary } from '@/components/shared/detail-boundary.tsx'
import { PageError } from '@/components/shared/page-error.tsx'
import { RelativeTime } from '@/components/shared/relative-time.tsx'
import { StatusBadge } from '@/components/shared/status-badge.tsx'

import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

import { sessionRevoke, sessionsList, sessionsRevokeOthers } from '../api.ts'
import type { SessionDto } from '../dto/index.ts'

function errorText(error: unknown): string {
	return isApiError(error) ? error.friendlyMessage : 'Something went wrong. Please try again.'
}

function renderSessionsError(_error: Error, retry: () => void) {
	return (
		<PageError
			title="Could not load sessions"
			message="Try loading your active sessions again."
			onRetry={retry}
		/>
	)
}

export function SessionsSection() {
	const query = useQuery(sessionsList.queryOptions({ retry: false, throwOnError: false }))

	return (
		<DetailBoundary query={query} error={renderSessionsError}>
			{(response) => <SessionList sessions={response.data} />}
		</DetailBoundary>
	)
}

function SessionList({ sessions }: { sessions: SessionDto[] }) {
	const revokeOne = useMutation(sessionRevoke.mutationOptions())
	const revokeOthers = useMutation(sessionsRevokeOthers.mutationOptions())
	const [pendingId, setPendingId] = useState<string | null>(null)
	const others = sessions.filter((s) => !s.isCurrent)

	const handleRevoke = async (session: SessionDto) => {
		setPendingId(session.id)
		try {
			await revokeOne.mutateAsync({ id: session.id })
			toast.add({ title: 'Session signed out.', type: 'success' })
		} catch (error) {
			toast.add({
				title: 'Could not sign out session',
				description: errorText(error),
				type: 'error',
			})
		} finally {
			setPendingId(null)
		}
	}

	const handleRevokeOthers = async () => {
		await confirm({
			title: 'Sign out all other sessions?',
			description: 'Every device except this one will have to sign in again.',
			confirmLabel: 'Sign out others',
			variant: 'destructive',
			onConfirm: async () => {
				try {
					const result = await revokeOthers.mutateAsync()
					toast.add({
						title: `${result.data.revoked} other ${result.data.revoked === 1 ? 'session' : 'sessions'} signed out.`,
						type: 'success',
					})
				} catch (error) {
					throw new Error(errorText(error), { cause: error })
				}
			},
		})
	}

	return (
		<div className="space-y-3">
			<ul className="divide-y rounded-lg border">
				{sessions.map((session) => (
					<li key={session.id} className="flex flex-wrap items-center gap-3 p-3">
						<MonitorIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
						<div className="min-w-0 flex-1 space-y-0.5">
							<p className="flex flex-wrap items-center gap-2 text-sm font-medium">
								<span className="truncate">{describeUserAgent(session.userAgent)}</span>
								{session.isCurrent && <StatusBadge variant="success">This device</StatusBadge>}
							</p>
							<p className="text-xs text-muted-foreground">
								{session.ipAddress ?? 'Unknown IP'} · Last active{' '}
								<RelativeTime value={session.lastSeenAt} />
							</p>
						</div>
						{!session.isCurrent && (
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={pendingId !== null}
								onClick={() => void handleRevoke(session)}
							>
								Sign out
							</Button>
						)}
					</li>
				))}
			</ul>
			{others.length > 0 && (
				<div className="flex justify-end">
					<Button
						type="button"
						variant="outline"
						disabled={pendingId !== null}
						onClick={() => void handleRevokeOthers()}
					>
						Sign out all other sessions
					</Button>
				</div>
			)}
		</div>
	)
}

/** A readable "Browser on OS" label; the raw agent string is not meant for people. */
export function describeUserAgent(userAgent: string | null): string {
	if (!userAgent) return 'Unknown device'
	const browser = /Edg\//u.test(userAgent)
		? 'Edge'
		: /OPR\/|Opera/u.test(userAgent)
			? 'Opera'
			: /Chrome\//u.test(userAgent)
				? 'Chrome'
				: /Firefox\//u.test(userAgent)
					? 'Firefox'
					: /Safari\//u.test(userAgent)
						? 'Safari'
						: undefined
	const os = /Windows/u.test(userAgent)
		? 'Windows'
		: /Android/u.test(userAgent)
			? 'Android'
			: /iPhone|iPad|iOS/u.test(userAgent)
				? 'iOS'
				: /Mac OS X|Macintosh/u.test(userAgent)
					? 'macOS'
					: /Linux/u.test(userAgent)
						? 'Linux'
						: undefined
	if (browser && os) return `${browser} on ${os}`
	return browser ?? os ?? userAgent
}
