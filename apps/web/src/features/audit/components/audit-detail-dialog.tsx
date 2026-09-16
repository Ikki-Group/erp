import { useQuery } from '@tanstack/react-query'

import { format } from 'date-fns'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
		<div className="space-y-1">
			<p className="text-xs font-medium text-muted-foreground">{label}</p>
			<pre className="overflow-x-auto rounded-md border bg-muted/40 p-3 text-xs">
				{JSON.stringify(value, null, 2)}
			</pre>
		</div>
	)
}

export function AuditDetailDialog({ entryId, onClose }: AuditDetailDialogProps) {
	const detailQuery = useQuery({
		...auditResource.detail.queryOptions({ id: entryId! }),
		enabled: entryId !== null,
	})
	// Only trust data that matches the currently-requested id — otherwise the
	// previous row's values flash under a newly-clicked row until the refetch lands.
	const loaded = detailQuery.data?.data
	const entry = loaded && loaded.id === entryId ? loaded : undefined
	const isLoading =
		detailQuery.isLoading || (entryId !== null && entry === undefined && !detailQuery.isError)

	return (
		<Dialog open={entryId !== null} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Detail Audit</DialogTitle>
				</DialogHeader>

				{isLoading ? (
					<div className="space-y-2">
						<Skeleton className="h-6 w-full" />
						<Skeleton className="h-24 w-full" />
					</div>
				) : detailQuery.isError ? (
					<p className="text-xs text-destructive">Gagal memuat detail audit.</p>
				) : entry ? (
					<div className="space-y-4">
						<dl className="grid grid-cols-2 gap-2 text-xs">
							<dt className="text-muted-foreground">Waktu</dt>
							<dd>{format(new Date(entry.timestamp), 'dd MMM yyyy, HH:mm:ss')}</dd>
							<dt className="text-muted-foreground">Aktor</dt>
							<dd>{entry.userName}</dd>
							<dt className="text-muted-foreground">Modul / Entitas</dt>
							<dd>
								{entry.module} / {entry.entity} #{entry.entityId}
							</dd>
							<dt className="text-muted-foreground">Aksi</dt>
							<dd>{entry.action}</dd>
						</dl>
						<p className="text-xs">{entry.summary}</p>
						<JsonBlock label="Nilai lama" value={entry.oldValues} />
						<JsonBlock label="Nilai baru" value={entry.newValues} />
						<JsonBlock label="Metadata" value={entry.metadata} />
					</div>
				) : null}
			</DialogContent>
		</Dialog>
	)
}
