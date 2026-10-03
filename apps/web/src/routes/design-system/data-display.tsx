import { useState } from 'react'

import { createFileRoute } from '@tanstack/react-router'

import { AlertTriangleIcon, BoxesIcon, ShoppingCartIcon, WalletIcon } from 'lucide-react'

import { IconTile } from '@/components/reui/icon-tile'
import {
	AuditTrail,
	CurrencyDisplay,
	DataCard,
	DetailList,
	PageHeader,
	PageSection,
	RelativeTime,
	SegmentedBar,
	StatCard,
	StatusBadge,
} from '@/components/shared'

import { Avatar, AvatarFallback, AvatarGroup } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
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
				description="Metrics, cards, badges, and other components for presenting read-only data."
			/>

			{/* ─── STAT CARDS ─── */}
			<PageSection
				title="Stat Cards"
				description="Dashboard-style metric display. tone tints the icon to match the metric's meaning; isLoading shows a skeleton; onClick makes the whole card an actionable, keyboard-operable button."
			>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<StatCard
						title="Total Orders"
						value="1,284"
						icon={<ShoppingCartIcon className="size-4" />}
						trend={{ value: '+12.5%', positive: true }}
					/>
					<StatCard
						title="Revenue"
						value="Rp 42.8M"
						icon={<WalletIcon className="size-4" />}
						trend={{ value: '+8.2%', positive: true }}
						description="This month"
						tone="success"
					/>
					<StatCard
						title="Low Stock"
						value="7"
						icon={<AlertTriangleIcon className="size-4" />}
						trend={{ value: '+3', positive: false }}
						tone="warning"
						onClick={() => alert('Would navigate to /inventory/stock')}
					/>
					<StatCard title="Materials" value="" icon={<BoxesIcon className="size-4" />} isLoading />
				</div>
			</PageSection>

			<Separator />

			{/* ─── ICON TILES ─── */}
			<PageSection
				title="Icon Tiles"
				description="Bordered icon chips used inside StatCard, EmptyState, and PageError instead of a plain icon. Recolor with a text-* class — soft/solid derive their fill from currentColor."
			>
				<div className="space-y-4">
					<div className="flex flex-wrap items-end gap-4">
						<IconTile variant="outline">
							<BoxesIcon />
						</IconTile>
						<IconTile variant="elevated">
							<BoxesIcon />
						</IconTile>
						<IconTile variant="soft">
							<BoxesIcon />
						</IconTile>
						<IconTile variant="solid">
							<BoxesIcon />
						</IconTile>
						<IconTile variant="frame">
							<BoxesIcon />
						</IconTile>
					</div>
					<div className="flex flex-wrap items-end gap-4">
						<IconTile variant="soft" className="text-success">
							<BoxesIcon />
						</IconTile>
						<IconTile variant="soft" className="text-warning">
							<AlertTriangleIcon />
						</IconTile>
						<IconTile variant="soft" className="text-destructive">
							<AlertTriangleIcon />
						</IconTile>
						<IconTile variant="soft" size="sm">
							<ShoppingCartIcon />
						</IconTile>
						<IconTile variant="soft" size="lg">
							<ShoppingCartIcon />
						</IconTile>
						<IconTile variant="soft" radius="full">
							<ShoppingCartIcon />
						</IconTile>
					</div>
				</div>
			</PageSection>

			<Separator />

			{/* ─── CARD ─── */}
			<PageSection
				title="Card"
				description="Base primitive — Header/Title/Description/Content/Footer slots. DataCard (below) is a themed convenience wrapper for the common title+content shape."
			>
				<Card className="max-w-sm">
					<CardHeader>
						<CardTitle>Coffee Beans (Arabica)</CardTitle>
						<CardDescription>MAT-001 · Raw Material</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">24.5 kg on hand across 3 locations.</p>
					</CardContent>
					<CardFooter className="gap-2">
						<Button size="sm" variant="outline">
							View
						</Button>
						<Button size="sm">Edit</Button>
					</CardFooter>
				</Card>
			</PageSection>

			<Separator />

			{/* ─── DATA CARD ─── */}
			<PageSection
				title="Data Card"
				description="Titled card section for grouped content. icon/tone pair with StatCard's tone tints — same visual family."
			>
				<div className="grid gap-4 lg:grid-cols-2">
					<DataCard
						title="Material Info"
						description="Basic information about the material."
						actions={
							<Button variant="outline" size="sm">
								Edit
							</Button>
						}
					>
						<DetailList
							items={[
								{ label: 'Supplier', value: 'PT Sumber Jaya' },
								{ label: 'Last Price', value: 'Rp 85,000 / kg' },
								{ label: 'Stock', value: '24.5 kg' },
								{ label: 'Avg Cost', value: 'Rp 82,340 / kg' },
							]}
						/>
					</DataCard>

					<DataCard
						title="Low Stock"
						description="Needs attention soon."
						icon={<AlertTriangleIcon className="size-4" />}
						tone="warning"
					>
						<p className="text-sm text-muted-foreground">7 materials below minimum stock.</p>
					</DataCard>
				</div>
			</PageSection>

			<Separator />

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

			{/* ─── SEGMENTED BAR ─── */}
			<PageSection title="Segmented Bar" description="Proportional breakdown visualization.">
				<div className="max-w-md space-y-6">
					<div className="space-y-1.5">
						<p className="text-xs font-medium text-muted-foreground uppercase">Opname Accuracy</p>
						<SegmentedBar
							items={[
								{ label: 'Matched', value: 188, className: 'bg-success' },
								{ label: 'Variance', value: 22, className: 'bg-destructive' },
								{ label: 'Not counted', value: 144, className: 'bg-muted' },
							]}
						/>
					</div>
					<div className="space-y-1.5">
						<p className="text-xs font-medium text-muted-foreground uppercase">Order Status</p>
						<SegmentedBar
							items={[
								{ label: 'Completed', value: 84, className: 'bg-success' },
								{ label: 'Open', value: 12, className: 'bg-info' },
								{ label: 'Voided', value: 4, className: 'bg-destructive' },
							]}
						/>
					</div>
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
