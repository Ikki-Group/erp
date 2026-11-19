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
	return isApiError(error) ? error.friendlyMessage : 'Terjadi kesalahan. Silakan coba lagi.'
}

function renderSessionsError(_error: Error, retry: () => void) {
	return (
		<PageError
			title="Gagal memuat sesi"
			message="Coba muat sesi aktif Anda lagi."
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
			toast.add({ title: 'Sesi berhasil dikeluarkan.', type: 'success' })
		} catch (error) {
			toast.add({
				title: 'Gagal mengeluarkan sesi',
				description: errorText(error),
				type: 'error',
			})
		} finally {
			setPendingId(null)
		}
	}

	const handleRevokeOthers = async () => {
		await confirm({
			title: 'Keluarkan semua sesi lain?',
			description: 'Semua perangkat selain perangkat ini harus masuk kembali.',
			confirmLabel: 'Keluarkan sesi lain',
			variant: 'destructive',
			onConfirm: async () => {
				try {
					const result = await revokeOthers.mutateAsync()
					toast.add({
						title: `${result.data.revoked} sesi lain telah dikeluarkan.`,
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
								{session.isCurrent && <StatusBadge variant="success">Perangkat ini</StatusBadge>}
							</p>
							<p className="text-xs text-muted-foreground">
								{session.ipAddress ?? 'IP tidak dikenal'} · Terakhir aktif{' '}
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
								Keluar
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
						Keluarkan semua sesi lain
					</Button>
				</div>
			)}
		</div>
	)
}

/** A readable "Browser on OS" label; the raw agent string is not meant for people. */
export function describeUserAgent(userAgent: string | null): string {
	if (!userAgent) return 'Perangkat tidak dikenal'
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
	if (browser && os) return `${browser} di ${os}`
	return browser ?? os ?? userAgent
}
