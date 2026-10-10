import { useMemo } from 'react'
import type { ReactNode } from 'react'

import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { ArrowLeftIcon } from 'lucide-react'
import { z } from 'zod'

import { listSearchSchema } from '@/components/data-table'
import { AuditTrail } from '@/components/shared/audit-trail'
import type { DateRange } from '@/components/shared/date-range-filter'
import { PageSection } from '@/components/shared/page-section'
import { usePermissionCheck } from '@/components/shared/permission-gate'
import { StatusBadge } from '@/components/shared/status-badge'
import type { StatusBadgeVariant } from '@/components/shared/status-badge'

import { Button } from '@/components/ui/button'

import { auditResource } from '@/features/audit/api.ts'
import { materialResource } from '@/features/material/api.ts'
import { uomResource } from '@/features/uom/api.ts'

import {
	OPNAME_STATUS_LABELS,
	RECEIVING_STATUS_LABELS,
	TRANSFER_STATUS_LABELS,
} from '../dto/index.ts'
import type { OpnameStatusEnum, ReceivingStatusEnum, TransferStatusEnum } from '../dto/index.ts'
import { useLocationContext } from '@/providers/location-provider.tsx'

// ─── List search (URL state) ───

/**
 * Document lists (receiving/transfer/opname) have no server text search, only
 * status + created-date range. The range lives in the URL as ISO strings.
 */
export const documentListSearchSchema = listSearchSchema.omit({ q: true }).extend({
	from: z.string().optional(),
	to: z.string().optional(),
})
export type DocumentListSearch = z.infer<typeof documentListSearchSchema>

export function searchToDateRange(search: DocumentListSearch): DateRange | undefined {
	return search.from && search.to
		? { from: new Date(search.from), to: new Date(search.to) }
		: undefined
}

export function dateRangeToSearch(range: DateRange | undefined) {
	return { page: 1, from: range?.from.toISOString(), to: range?.to.toISOString() }
}

// ─── Status badges ───

const RECEIVING_VARIANTS: Record<ReceivingStatusEnum, StatusBadgeVariant> = {
	draft: 'warning',
	confirmed: 'success',
}
const TRANSFER_VARIANTS: Record<TransferStatusEnum, StatusBadgeVariant> = {
	requested: 'info',
	in_transit: 'warning',
	received: 'success',
	cancelled: 'destructive',
}
const OPNAME_VARIANTS: Record<OpnameStatusEnum, StatusBadgeVariant> = {
	draft: 'warning',
	in_progress: 'warning',
	completed: 'success',
	cancelled: 'destructive',
}

export function ReceivingStatusBadge({ status }: { status: ReceivingStatusEnum }) {
	return (
		<StatusBadge variant={RECEIVING_VARIANTS[status]}>
			{RECEIVING_STATUS_LABELS[status]}
		</StatusBadge>
	)
}
export function TransferStatusBadge({ status }: { status: TransferStatusEnum }) {
	return (
		<StatusBadge variant={TRANSFER_VARIANTS[status]}>{TRANSFER_STATUS_LABELS[status]}</StatusBadge>
	)
}
export function OpnameStatusBadge({ status }: { status: OpnameStatusEnum }) {
	return <StatusBadge variant={OPNAME_VARIANTS[status]}>{OPNAME_STATUS_LABELS[status]}</StatusBadge>
}

// ─── Lookups ───

/** Name/code lookups for line items, which only carry ids. */
export function useLineLookups() {
	const materialsQuery = useQuery(materialResource.list.queryOptions({ page: 1, limit: 500 }))
	const uomsQuery = useQuery(uomResource.list.queryOptions({ page: 1, limit: 200 }))
	return useMemo(() => {
		const materials = new Map((materialsQuery.data?.data ?? []).map((m) => [m.id, m] as const))
		const uoms = new Map((uomsQuery.data?.data ?? []).map((u) => [u.id, u.code] as const))
		return {
			material: (id: number) => materials.get(id),
			uomCode: (id: number) => uoms.get(id) ?? '',
		}
	}, [materialsQuery.data, uomsQuery.data])
}

export function useLocationName() {
	const { locations } = useLocationContext()
	return useMemo(() => {
		const map = new Map(locations.map((l) => [l.id, l.name] as const))
		return (id: number) => map.get(id) ?? `#${id}`
	}, [locations])
}

// ─── Small presentational pieces ───

/** Material name with its code as a muted mono secondary identifier. */
export function MaterialLabel({ name, code }: { name: ReactNode; code?: string }) {
	return (
		<span className="flex min-w-0 flex-col">
			<span className="truncate font-medium">{name}</span>
			{code && <span className="font-mono text-xs text-muted-foreground">{code}</span>}
		</span>
	)
}

export function formatQty(value: string | number) {
	return Number(value).toLocaleString('id-ID', { maximumFractionDigits: 6 })
}

export function formatDate(value: string | Date | null | undefined) {
	if (!value) return '—'
	return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(value))
}

/** Audit activity section for a document detail page (hidden without `audit.read`). */
export function DocumentActivity({
	entity,
	entityId,
	version,
}: {
	entity: string
	entityId: number
	/** The document's `updatedAt`: a new value refetches the trail after a status change. */
	version: string | Date
}) {
	const canReadAudit = usePermissionCheck({ permission: 'audit.read' })
	const options = auditResource.byEntity.queryOptions({ entity, entityId })
	const auditQuery = useQuery({
		...options,
		queryKey: [...options.queryKey, String(version)] as typeof options.queryKey,
		enabled: canReadAudit,
	})
	if (!canReadAudit) return null
	return (
		<PageSection title="Aktivitas" description="Riwayat perubahan dokumen ini.">
			<AuditTrail
				entries={auditQuery.data?.data ?? []}
				isLoading={auditQuery.isLoading}
				emptyMessage="Belum ada aktivitas."
			/>
		</PageSection>
	)
}

/** Back link above a document detail page. */
export function BackLink({
	to,
	label,
}: {
	to: '/inventory/receiving' | '/inventory/transfers' | '/inventory/opname'
	label: string
}) {
	return (
		<Button
			variant="ghost"
			size="sm"
			className="-ml-2 gap-1.5 pointer-coarse:h-10"
			nativeButton={false}
			render={<Link to={to} />}
		>
			<ArrowLeftIcon className="size-3.5" />
			{label}
		</Button>
	)
}
