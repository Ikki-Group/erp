import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'

import { PencilIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import {
	DetailBoundary,
	DetailList,
	DetailPage,
	DetailSection,
	StatCard,
} from '@/components/shared'
import { CurrencyDisplay } from '@/components/shared/currency-display'
import { PageError } from '@/components/shared/page-error'
import { usePermissionCheck } from '@/components/shared/permission-gate'
import { StatusBadge } from '@/components/shared/status-badge'

import { Button } from '@/components/ui/button'

import { companyDetail, companyOverview } from '@/features/company/api.ts'
import type { CompanyOverviewDto, CompanySettingsDto } from '@/features/company/dto/index.ts'

export const Route = createFileRoute('/_authenticated/settings/company/')({
	component: CompanyOverviewPage,
})

function CompanyOverviewPage() {
	const canRead = usePermissionCheck({ permission: 'company.read' })
	const canUpdate = usePermissionCheck({ permission: 'company.update' })
	const settingsQuery = useQuery(
		companyDetail.queryOptions({ retry: false, enabled: canRead, throwOnError: false }),
	)
	const overviewQuery = useQuery(
		companyOverview.queryOptions({ retry: false, enabled: canRead, throwOnError: false }),
	)

	if (!canRead) {
		return <PageError title="No access" message="You don't have permission to view the company." />
	}

	return (
		<DetailBoundary query={settingsQuery} error={renderError}>
			{(settings) => (
				<DetailPage
					title={settings.data.name}
					description="Company overview"
					actions={canUpdate ? <EditButton /> : undefined}
				>
					<DetailSection title="Company profile">
						<ProfileDetails settings={settings.data} />
					</DetailSection>
					<DetailBoundary query={overviewQuery} error={renderError}>
						{(overview) => (
							<OverviewBody
								overview={overview.data}
								currencySymbol={settings.data.currencySymbol}
							/>
						)}
					</DetailBoundary>
				</DetailPage>
			)}
		</DetailBoundary>
	)
}

function renderError(_error: Error, retry: () => void) {
	return <PageError title="Could not load the company overview" onRetry={retry} />
}

function EditButton() {
	const navigate = useNavigate()
	return (
		<Button size="sm" onClick={() => navigate({ to: '/settings/company/edit' })}>
			<PencilIcon className="size-4" />
			Edit
		</Button>
	)
}

function ProfileDetails({ settings }: { settings: CompanySettingsDto }) {
	return (
		<DetailList
			columns={3}
			items={[
				{ label: 'Name', value: settings.name },
				{ label: 'Address', value: settings.address || '-' },
				{ label: 'Phone', value: settings.phone || '-' },
				{ label: 'Email', value: settings.email || '-' },
				{ label: 'Tax ID', value: settings.taxId || '-' },
				{ label: 'Tax rate', value: `${settings.taxRate}%` },
				{ label: 'Currency', value: `${settings.currencyCode} (${settings.currencySymbol})` },
				{ label: 'Receipt footer', value: settings.receiptFooter || '-' },
			]}
		/>
	)
}

function OverviewBody({
	overview,
	currencySymbol,
}: {
	overview: CompanyOverviewDto
	currencySymbol: string
}) {
	const navigate = useNavigate()
	const { locations, people } = overview
	return (
		<>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard
					title="Locations"
					value={locations.total}
					description={`${plural(locations.stores, 'store')}, ${plural(locations.warehouses, 'warehouse')}, ${locations.inactive} inactive`}
				/>
				{people && (
					<>
						<StatCard
							title="People"
							value={people.activeUsers}
							description={`Active users, ${people.inactiveUsers} inactive`}
							onClick={() => navigate({ to: '/settings/access-control', search: { tab: 'users' } })}
						/>
						<StatCard
							title="Without access"
							value={people.usersWithoutAccess}
							description="Active users with no assignment"
							tone={people.usersWithoutAccess > 0 ? 'warning' : 'default'}
						/>
						<StatCard
							title="Roles"
							value={people.roles}
							onClick={() => navigate({ to: '/settings/access-control', search: { tab: 'roles' } })}
						/>
					</>
				)}
			</div>
			<DetailSection title="Sites" description={`Business day ${overview.businessDate}`}>
				<ul className="space-y-3">
					{overview.sites.map((site) => (
						<SiteRow key={site.id} site={site} currencySymbol={currencySymbol} />
					))}
				</ul>
			</DetailSection>
		</>
	)
}

function plural(count: number, noun: string): string {
	return `${count} ${noun}${count === 1 ? '' : 's'}`
}

function SiteRow({
	site,
	currencySymbol,
}: {
	site: CompanyOverviewDto['sites'][number]
	currencySymbol: string
}) {
	return (
		<li className="rounded-xl border border-border bg-card p-4">
			<div className="flex flex-wrap items-center gap-2">
				<Link
					to="/settings/locations/$locationId"
					params={{ locationId: String(site.id) }}
					className="text-sm font-medium hover:underline"
				>
					{site.name}
				</Link>
				<span className="text-xs text-muted-foreground">{site.code}</span>
				<StatusBadge variant="outline">{site.type === 'store' ? 'Store' : 'Warehouse'}</StatusBadge>
				{!site.isActive && <StatusBadge>Inactive</StatusBadge>}
			</div>
			<dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4 lg:grid-cols-8">
				<Metric label="Staff" value={site.staff} />
				<Metric label="In transit" value={site.transfersInTransit} />
				<Metric label="Draft receivings" value={site.draftReceivings} />
				<Metric label="Open opnames" value={site.openOpnames} />
				<Metric label="Low stock" value={site.lowStock} warn={site.lowStock > 0} />
				<Metric label="Open shifts" value={site.openShifts} />
				<Metric label="Orders today" value={site.salesToday.orders} />
				<div className="space-y-0.5 text-right">
					<dt className="text-xs text-muted-foreground">Revenue today</dt>
					<dd className="font-mono text-sm font-medium tabular-nums">
						<CurrencyDisplay value={site.salesToday.revenue} currency={currencySymbol} />
					</dd>
				</div>
			</dl>
		</li>
	)
}

function Metric({ label, value, warn = false }: { label: string; value: number; warn?: boolean }) {
	return (
		<div className="space-y-0.5 text-right">
			<dt className="text-xs text-muted-foreground">{label}</dt>
			<dd className={cn('font-mono text-sm font-medium tabular-nums', warn && 'text-warning')}>
				{value}
			</dd>
		</div>
	)
}
