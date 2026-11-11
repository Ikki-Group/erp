import { useQuery } from '@tanstack/react-query'

import { format } from 'date-fns'

import { DetailBoundary } from '@/components/shared/detail-boundary'
import { InlineAlert } from '@/components/shared/inline-alert'
import { usePermissionCheck } from '@/components/shared/permission-gate'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'

import { auditResource } from '../api.ts'

interface AuditDetailDialogProps {
	/** Audit entry id to show; `null` closes the dialog. */
	entryId: number | null
	onClose: () => void
}

function JsonBlock({ label, value }: { label: string; value: unknown }) {
	if (value === null || value === undefined) return null
	return (
		<div className="min-w-0 space-y-1">
			<p className="text-xs font-medium text-muted-foreground">{label}</p>
			<pre
				role="region"
				aria-label={label}
				tabIndex={0}
				className="max-w-full overflow-x-auto rounded-md border bg-muted/40 p-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
			>
				{JSON.stringify(value, null, 2)}
			</pre>
		</div>
	)
}

const DETAIL_LOADING = (
	<div className="space-y-2" aria-busy="true">
		<Skeleton className="h-6 w-full" />
		<Skeleton className="h-24 w-full" />
	</div>
)

function renderDetailError(_error: Error, retry: () => void) {
	return (
		<InlineAlert variant="error" title="Gagal memuat detail audit">
			<p>Detail audit tidak dapat dimuat. Coba lagi.</p>
			<Button type="button" variant="outline" size="sm" onClick={retry}>
				Coba lagi
			</Button>
		</InlineAlert>
	)
}

export function AuditDetailDialog({ entryId, onClose }: AuditDetailDialogProps) {
	const canRead = usePermissionCheck({ permission: 'audit.read' })
	const enabled = canRead && entryId !== null
	const detailQuery = useQuery({
		...auditResource.detail.queryOptions({ id: entryId ?? 0 }),
		enabled,
		throwOnError: false,
	})

	return (
		<Dialog open={enabled} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)] gap-4 sm:max-w-lg">
				<DialogHeader className="pr-12">
					<DialogTitle>Detail Audit</DialogTitle>
					<DialogDescription>
						Rincian perubahan yang tercatat, termasuk nilai lama dan baru.
					</DialogDescription>
				</DialogHeader>

				<div className="min-h-0 min-w-0 overflow-y-auto">
					{enabled && (
						<DetailBoundary
							key={entryId}
							query={detailQuery}
							loading={DETAIL_LOADING}
							error={renderDetailError}
						>
							{(response) => {
								const entry = response.data
								return (
									<div className="min-w-0 space-y-4">
										<dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-xs">
											<dt className="text-muted-foreground">Waktu</dt>
											<dd className="min-w-0 break-words">
												{format(new Date(entry.timestamp), 'dd MMM yyyy, HH:mm:ss')}
											</dd>
											<dt className="text-muted-foreground">Aktor</dt>
											<dd className="min-w-0 break-words">{entry.userName}</dd>
											<dt className="text-muted-foreground">Modul / Entitas</dt>
											<dd className="min-w-0 break-words">
												{entry.module} / {entry.entity} #{entry.entityId}
											</dd>
											<dt className="text-muted-foreground">Aksi</dt>
											<dd className="min-w-0 break-words">{entry.action}</dd>
										</dl>
										<p className="break-words text-xs">{entry.summary}</p>
										<JsonBlock label="Nilai lama" value={entry.oldValues} />
										<JsonBlock label="Nilai baru" value={entry.newValues} />
										<JsonBlock label="Metadata" value={entry.metadata} />
									</div>
								)
							}}
						</DetailBoundary>
					)}
				</div>
			</DialogContent>
		</Dialog>
	)
}
