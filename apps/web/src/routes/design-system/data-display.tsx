import { useState } from 'react'

import { createFileRoute } from '@tanstack/react-router'

import {
	AuditTrail,
	CurrencyDisplay,
	DetailList,
	PageHeader,
	PageSection,
	RelativeTime,
	StatusBadge,
} from '@/components/shared'

import { Avatar, AvatarFallback, AvatarGroup } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

import type { AuditLogDto } from '@/features/audit/dto/index.ts'

export const Route = createFileRoute('/design-system/data-display')({
	component: DataDisplayPage,
})

function DataDisplayPage() {
	return (
		<div className="space-y-10">
			<PageHeader
				title="Data Display"
				description="Badges, detail lists, money, time, and activity for presenting read-only data. Cards live on the Cards page."
			/>

			{/* ─── DETAIL LIST ─── */}
			<PageSection title="Detail List" description="Key-value pairs for detail pages.">
				<DetailList
					items={[
						{ label: 'Code', value: 'MAT-001' },
						{ label: 'Name', value: 'Coffee Beans (Arabica)' },
						{ label: 'Category', value: 'Raw Material' },
						{ label: 'Base UoM', value: 'kg' },
						{ label: 'Min Stock', value: '10 kg' },
						{ label: 'Status', value: <StatusBadge variant="success">Active</StatusBadge> },
					]}
					columns={3}
				/>
			</PageSection>

			<Separator />

			{/* ─── STATUS BADGES ─── */}
			<PageSection title="Status Badges" description="Variants for workflow states.">
				<div className="flex flex-wrap gap-3">
					<StatusBadge variant="default">Draft</StatusBadge>
					<StatusBadge variant="info">In Transit</StatusBadge>
					<StatusBadge variant="warning">Pending</StatusBadge>
					<StatusBadge variant="success">Completed</StatusBadge>
					<StatusBadge variant="destructive">Cancelled</StatusBadge>
					<StatusBadge variant="outline">Archived</StatusBadge>
					<StatusBadge variant="success" dot={false}>
						No Dot
					</StatusBadge>
				</div>
			</PageSection>

			<Separator />

			{/* ─── CURRENCY DISPLAY ─── */}
			<PageSection
				title="Currency Display"
				description="Formatted IDR values with optional sign/color."
			>
				<div className="flex flex-wrap items-baseline gap-6">
					<div className="space-y-1">
						<p className="text-xs text-muted-foreground">Price</p>
						<CurrencyDisplay value={85000} className="text-sm font-medium" />
					</div>
					<div className="space-y-1">
						<p className="text-xs text-muted-foreground">Cost (decimal)</p>
						<CurrencyDisplay value={82340.5} className="text-sm font-medium" />
					</div>
					<div className="space-y-1">
						<p className="text-xs text-muted-foreground">Positive trend</p>
						<CurrencyDisplay value={12500} showSign colored className="text-sm font-medium" />
					</div>
					<div className="space-y-1">
						<p className="text-xs text-muted-foreground">Negative trend</p>
						<CurrencyDisplay value={-8200} showSign colored className="text-sm font-medium" />
					</div>
					<div className="space-y-1">
						<p className="text-xs text-muted-foreground">Invalid</p>
						<CurrencyDisplay value={Number.NaN} className="text-sm" />
					</div>
				</div>
			</PageSection>

			<Separator />

			{/* ─── RELATIVE TIME ─── */}
			<PageSection
				title="Relative Time"
				description="«X ago» timestamps for activity feeds — ticks forward automatically, absolute date/time on hover. Backed by date-fns, not hand-rolled minute/hour math."
			>
				<dl className="grid max-w-md grid-cols-2 gap-3 text-sm">
					<dt className="text-muted-foreground">Just now</dt>
					<dd>
						<RelativeTime value={new Date(Date.now() - 15_000)} />
					</dd>
					<dt className="text-muted-foreground">8 minutes ago</dt>
					<dd>
						<RelativeTime value={new Date(Date.now() - 8 * 60_000)} />
					</dd>
					<dt className="text-muted-foreground">3 hours ago</dt>
					<dd>
						<RelativeTime value={new Date(Date.now() - 3 * 3_600_000)} />
					</dd>
					<dt className="text-muted-foreground">2 days ago</dt>
					<dd>
						<RelativeTime value={new Date(Date.now() - 2 * 86_400_000)} />
					</dd>
				</dl>
			</PageSection>

			<Separator />

			{/* ─── AUDIT TRAIL ─── */}
			<PageSection
				title="Audit Trail"
				description="Chronological activity log for a single entity, rendered on the Timeline primitive — used in Opname/Receiving/Transfers/Material/User detail pages."
			>
				<AuditTrailDemo />
			</PageSection>

			<Separator />

			{/* ─── AVATAR ─── */}
			<PageSection
				title="Avatar"
				description="User initials/photo — used in the app header's user menu."
			>
				<div className="flex items-center gap-6">
					<div className="flex items-center gap-3">
						<Avatar size="sm">
							<AvatarFallback>BS</AvatarFallback>
						</Avatar>
						<Avatar>
							<AvatarFallback>BS</AvatarFallback>
						</Avatar>
						<Avatar size="lg">
							<AvatarFallback>BS</AvatarFallback>
						</Avatar>
					</div>
					<AvatarGroup>
						<Avatar>
							<AvatarFallback>BS</AvatarFallback>
						</Avatar>
						<Avatar>
							<AvatarFallback>SR</AvatarFallback>
						</Avatar>
						<Avatar>
							<AvatarFallback>AP</AvatarFallback>
						</Avatar>
					</AvatarGroup>
				</div>
			</PageSection>
		</div>
	)
}

// -- Audit Trail demo (mock entries, loading/empty toggle) --
const AUDIT_ENTRIES: AuditLogDto[] = [
	{
		id: 1,
		timestamp: new Date(Date.now() - 10 * 60_000),
		userId: 1,
		userName: 'Budi Santoso',
		locationId: 1,
		module: 'inventory',
		entity: 'material',
		entityId: 42,
		action: 'update',
		summary: 'Updated min stock from 10 kg to 15 kg',
	},
	{
		id: 2,
		timestamp: new Date(Date.now() - 3 * 3_600_000),
		userId: 2,
		userName: 'Siti Rahma',
		locationId: 1,
		module: 'inventory',
		entity: 'material',
		entityId: 42,
		action: 'update',
		summary: 'Changed supplier from CV Makmur Sentosa to PT Sumber Jaya',
	},
	{
		id: 3,
		timestamp: new Date(Date.now() - 2 * 86_400_000),
		userId: 2,
		userName: 'Siti Rahma',
		locationId: 1,
		module: 'inventory',
		entity: 'material',
		entityId: 42,
		action: 'create',
		summary: 'Created material "Coffee Beans (Arabica)"',
	},
]

function AuditTrailDemo() {
	const [state, setState] = useState<'loaded' | 'loading' | 'empty'>('loaded')

	return (
		<div className="max-w-lg space-y-3">
			<div className="flex gap-2">
				{(['loaded', 'loading', 'empty'] as const).map((s) => (
					<Button
						key={s}
						size="sm"
						variant={state === s ? 'default' : 'outline'}
						onClick={() => setState(s)}
						className="capitalize"
					>
						{s}
					</Button>
				))}
			</div>
			<AuditTrail
				entries={state === 'empty' ? [] : AUDIT_ENTRIES}
				isLoading={state === 'loading'}
				emptyMessage="No changes recorded for this material yet."
			/>
		</div>
	)
}
