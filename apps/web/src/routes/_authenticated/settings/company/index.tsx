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
		return (
			<PageError
				title="Tidak ada akses"
				message="Anda tidak memiliki izin untuk melihat perusahaan."
			/>
		)
	}

	return (
		<DetailBoundary query={settingsQuery} error={renderError}>
			{(settings) => (
				<DetailPage
					title={settings.data.name}
					description="Ringkasan perusahaan"
					actions={canUpdate ? <EditButton /> : undefined}
				>
					<DetailSection title="Profil perusahaan">
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
	return <PageError title="Gagal memuat ringkasan perusahaan" onRetry={retry} />
}

function EditButton() {
	const navigate = useNavigate()
	return (
		<Button size="sm" onClick={() => navigate({ to: '/settings/company/edit' })}>
			<PencilIcon />
			Ubah
		</Button>
	)
}

function ProfileDetails({ settings }: { settings: CompanySettingsDto }) {
	return (
		<DetailList
			columns={3}
			items={[
				{ label: 'Nama', value: settings.name },
				{ label: 'Alamat', value: settings.address || '-' },
				{ label: 'Telepon', value: settings.phone || '-' },
				{ label: 'Email', value: settings.email || '-' },
				{ label: 'NPWP', value: settings.taxId || '-' },
				{ label: 'Tarif pajak', value: `${settings.taxRate}%` },
				{ label: 'Mata uang', value: `${settings.currencyCode} (${settings.currencySymbol})` },
				{ label: 'Footer struk', value: settings.receiptFooter || '-' },
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
					title="Lokasi"
					value={locations.total}
					description={`${plural(locations.stores, 'toko')}, ${plural(locations.warehouses, 'gudang')}, ${locations.inactive} nonaktif`}
				/>
				{people && (
					<>
						<StatCard
							title="Orang"
							value={people.activeUsers}
							description={`Pengguna aktif, ${people.inactiveUsers} nonaktif`}
							onClick={() => navigate({ to: '/settings/access-control', search: { tab: 'users' } })}
						/>
						<StatCard
							title="Tanpa akses"
							value={people.usersWithoutAccess}
							description="Pengguna aktif tanpa penugasan"
							tone={people.usersWithoutAccess > 0 ? 'warning' : 'default'}
						/>
						<StatCard
							title="Peran"
							value={people.roles}
							onClick={() => navigate({ to: '/settings/access-control', search: { tab: 'roles' } })}
						/>
					</>
				)}
			</div>
			<DetailSection title="Lokasi Usaha" description={`Hari bisnis ${overview.businessDate}`}>
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
	return `${count} ${noun}`
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
					className="inline-flex min-h-6 items-center text-sm font-medium hover:underline"
				>
					{site.name}
				</Link>
				<span className="text-xs text-muted-foreground">{site.code}</span>
				<StatusBadge variant="outline">{site.type === 'store' ? 'Toko' : 'Gudang'}</StatusBadge>
				{!site.isActive && <StatusBadge>Nonaktif</StatusBadge>}
			</div>
			<dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4 lg:grid-cols-8">
				<Metric label="Staf" value={site.staff} />
				<Metric label="Dalam perjalanan" value={site.transfersInTransit} />
				<Metric label="Penerimaan draf" value={site.draftReceivings} />
				<Metric label="Opname terbuka" value={site.openOpnames} />
				<Metric label="Stok menipis" value={site.lowStock} warn={site.lowStock > 0} />
				<Metric label="Shift terbuka" value={site.openShifts} />
				<Metric label="Pesanan hari ini" value={site.salesToday.orders} />
				<div className="space-y-0.5 text-right">
					<dt className="text-xs text-muted-foreground">Pendapatan hari ini</dt>
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
