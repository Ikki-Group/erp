import { InboxIcon, PackageIcon, UsersIcon, DollarSignIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

import type { ComponentRegistryEntry } from '../registry'
import { IkkiLogo } from './brand/logo'
import { CardSection } from './card/card-section'
import { CardStat } from './card/card-stat'
import { BadgeDot } from './data-display/badge-dot'
import { DataList } from './data-display/data-list'
import { DescriptionList } from './data-display/description-list'
import { DetailCard } from './data-display/detail-card'
import { ActiveStatusBadge, StatusBadge, activeStatusMap } from './data-display/status-badge'
import { EmptyState } from './feedback/empty-state'
import { LoadingPage } from './feedback/loading-page'

/**
 * Preview renderers for blocks components.
 * Keyed by component `name` from the registry.
 */
export const blocksPreviews: Record<string, ComponentRegistryEntry['preview']> = {
	StatusBadge: () => (
		<div className="flex items-center gap-2 flex-wrap">
			<ActiveStatusBadge status="active" />
			<ActiveStatusBadge status="inactive" />
			<StatusBadge status="active" statusMap={activeStatusMap} />
		</div>
	),

	BadgeDot: () => (
		<div className="flex items-center gap-3">
			<BadgeDot color="green" />
			<BadgeDot color="red" />
			<BadgeDot color="yellow" />
		</div>
	),

	DataList: () => (
		<DataList>
			<DataList.Item label="Nama" value="John Doe" />
			<DataList.Item label="Email" value="john@example.com" />
			<DataList.Item label="Role" value="Administrator" />
		</DataList>
	),

	DescriptionList: () => (
		<DescriptionList
			items={[
				{ term: 'Nama', description: 'John Doe' },
				{ term: 'Email', description: 'john@example.com' },
				{ term: 'Role', description: 'Administrator' },
			]}
		/>
	),

	DetailCard: () => (
		<DetailCard
			title="Informasi Pengguna"
			items={[
				{ term: 'Nama', description: 'John Doe' },
				{ term: 'Email', description: 'john@example.com' },
				{ term: 'Role', description: 'Administrator' },
				{ term: 'Status', description: <ActiveStatusBadge status="active" /> },
			]}
		/>
	),

	CardSection: () => (
		<CardSection title="Section Title" description="Section description goes here">
			<div className="flex items-center gap-4">
				<div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center">
					<PackageIcon className="size-6 text-primary" />
				</div>
				<div>
					<p className="font-medium">Content Item</p>
					<p className="text-sm text-muted-foreground">Description text</p>
				</div>
			</div>
		</CardSection>
	),

	CardStat: () => (
		<div className="grid grid-cols-3 gap-4">
			<CardStat
				title="Total Users"
				value="1,234"
				icon={UsersIcon}
				description="+12% from last month"
			/>
			<CardStat
				title="Revenue"
				value="$45.2K"
				icon={DollarSignIcon}
				description="+8% from last month"
			/>
			<CardStat title="Growth" value="24%" icon={UsersIcon} description="-5% from last month" />
		</div>
	),

	EmptyState: () => (
		<EmptyState
			icon={InboxIcon}
			title="Belum ada data"
			description="Mulai dengan menambahkan item baru."
			action={<Button size="sm">Tambah Data</Button>}
		/>
	),

	LoadingPage: () => (
		<div className="h-32 relative">
			<LoadingPage />
		</div>
	),

	IkkiLogo: () => (
		<div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
			<IkkiLogo />
			<span className="text-sm text-muted-foreground">Official Logo</span>
		</div>
	),
}
