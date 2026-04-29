import { CardSection } from './card-section'

interface AuditCardProps {
	createdAt: string | Date
	updatedAt: string | Date
	recordId?: string | number
}

export function AuditCard({ createdAt, updatedAt, recordId }: AuditCardProps) {
	return (
		<CardSection title="Audit">
			<div className="space-y-3">
				<div className="flex flex-col gap-0.5">
					<span className="text-xs text-muted-foreground">Dibuat Pada</span>
					<span className="text-sm">{new Date(createdAt).toLocaleString('id-ID')}</span>
				</div>
				<div className="flex flex-col gap-0.5">
					<span className="text-xs text-muted-foreground">Diperbarui</span>
					<span className="text-sm">{new Date(updatedAt).toLocaleString('id-ID')}</span>
				</div>
				{recordId !== undefined && (
					<div className="flex flex-col gap-0.5">
						<span className="text-xs text-muted-foreground">Record ID</span>
						<span className="text-sm font-mono">#{recordId}</span>
					</div>
				)}
			</div>
		</CardSection>
	)
}
