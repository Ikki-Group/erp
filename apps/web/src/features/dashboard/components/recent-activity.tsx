import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { ArrowRightIcon } from 'lucide-react'

import { RelativeTime } from '@/components/shared'

import { Button } from '@/components/ui/button'

import { auditResource } from '@/features/audit/api.ts'

import { humanizeActivity } from '../activity.ts'
import { Panel } from './panel.tsx'

const SHOWN = 6

/** Latest non-POS audit entries as readable sentences. */
export function RecentActivity({ className }: { className?: string }) {
	const query = useQuery({
		...auditResource.list.queryOptions({ page: 1, limit: SHOWN, excludeModulePrefix: 'pos' }),
		refetchInterval: 30_000,
		staleTime: 20_000,
	})
	const entries = query.data?.data ?? []

	return (
		<Panel
			className={className}
			title="Aktivitas terbaru"
			action={
				<Button
					variant="ghost"
					size="sm"
					nativeButton={false}
					render={<Link to="/settings/audit" />}
				>
					Log audit
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
			}
			query={query}
			items={entries}
			getKey={(e) => e.id}
			errorMessage="Aktivitas terbaru tidak dapat dimuat."
			empty={{
				title: 'Belum ada aktivitas',
				description: 'Aktivitas terbaru akan muncul di sini.',
			}}
			renderItem={(entry) => {
				const line = humanizeActivity(entry)
				return (
					<div className="min-w-0 space-y-0.5">
						<p className="text-sm">
							<span className="font-medium">{line.actor}</span> {line.verb} {line.entity}
							{line.subject && (
								<>
									{' '}
									<span className={line.subject.code ? 'font-mono' : 'font-medium'}>
										{line.subject.text}
									</span>
								</>
							)}
						</p>
						<RelativeTime value={entry.timestamp} className="text-xs text-muted-foreground" />
					</div>
				)
			}}
		/>
	)
}
