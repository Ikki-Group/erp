import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

import { PageHeader } from '@/components/shared'

import { inventorySummary } from '@/features/dashboard/api.ts'
import { LocationPanels } from '@/features/dashboard/components/location-panels.tsx'
import { LocationRollup } from '@/features/dashboard/components/location-rollup.tsx'
import { RecentActivity } from '@/features/dashboard/components/recent-activity.tsx'
import { transferResource } from '@/features/inventory/api.ts'

import { useAuth } from '@/providers/auth-provider.tsx'
import { useLocationContext } from '@/providers/location-provider.tsx'

export const Route = createFileRoute('/_authenticated/')({
	component: DashboardPage,
})

const LIVE = { refetchInterval: 30_000, staleTime: 20_000 }

function DashboardPage() {
	const { user } = useAuth()
	const { activeLocation } = useLocationContext()
	const scopeLabel = activeLocation?.name ?? 'Semua lokasi'

	const summaryQuery = useQuery({ ...inventorySummary.queryOptions(), ...LIVE })
	// Distinct count for the rollup's total row (the per-location column counts each transfer at both ends).
	const transfersTotalQuery = useQuery({
		...transferResource.list.queryOptions({ page: 1, limit: 1, status: 'in_transit' }),
		...LIVE,
		enabled: activeLocation === null,
	})

	return (
		<div className="space-y-6">
			<PageHeader
				title={`Selamat datang, ${user?.name?.split(' ')[0] ?? 'kembali'}`}
				description={`Ringkasan operasional · ${scopeLabel} · ${format(new Date(), 'EEEE, d MMMM yyyy', { locale: idLocale })}`}
			/>

			<div className="grid gap-6 xl:grid-cols-3">
				<div className="min-w-0 xl:col-span-2">
					{activeLocation === null ? (
						<LocationRollup
							rows={summaryQuery.data?.data}
							query={summaryQuery}
							transfersTotal={transfersTotalQuery.data?.meta?.total}
						/>
					) : (
						<LocationPanels
							key={activeLocation.id}
							locationId={activeLocation.id}
							summary={summaryQuery.data?.data.find((row) => row.id === activeLocation.id)}
						/>
					)}
				</div>
				<RecentActivity className="min-w-0" />
			</div>
		</div>
	)
}
