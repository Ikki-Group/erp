import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { ArrowRightIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import { InlineAlert, RelativeTime } from '@/components/shared'

import { Button } from '@/components/ui/button'

import {
	opnameResource,
	receivingResource,
	stockBalanceList,
	transferResource,
} from '@/features/inventory/api.ts'

import type { InventoryLocationSummaryDto } from '../api.ts'
import { Panel } from './panel.tsx'
import { useLocationContext } from '@/providers/location-provider.tsx'

const LIVE = { refetchInterval: 30_000, staleTime: 20_000 }
const PREVIEW = 5

const qtyFormat = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 3 })
const qty = (value: string) => qtyFormat.format(Number(value))

function ViewAll({ link, children }: { link: React.ReactElement; children: string }) {
	return (
		<Button variant="ghost" size="sm" nativeButton={false} render={link}>
			{children}
			<ArrowRightIcon data-icon="inline-end" />
		</Button>
	)
}

interface LocationPanelsProps {
	locationId: number
	/** This location's row from the summary; undefined while it loads. */
	summary: InventoryLocationSummaryDto | undefined
}

/** Single-location view: the four operational lists, counts from the shared summary. */
export function LocationPanels({ locationId, summary }: LocationPanelsProps) {
	const { locations } = useLocationContext()
	const nameById = useMemo(() => new Map(locations.map((l) => [l.id, l.name])), [locations])
	const nameOf = (id: number) => nameById.get(id) ?? `Lokasi #${id}`

	const stockQuery = useQuery({
		...stockBalanceList.queryOptions({ page: 1, limit: PREVIEW, locationId, status: 'low' }),
		...LIVE,
	})
	const lowStock = stockQuery.data?.data ?? []

	const transfersQuery = useQuery({
		...transferResource.list.queryOptions({
			page: 1,
			limit: PREVIEW,
			locationId,
			status: 'in_transit',
		}),
		...LIVE,
	})
	const receivingQuery = useQuery({
		...receivingResource.list.queryOptions({
			page: 1,
			limit: PREVIEW,
			locationId,
			status: 'draft',
		}),
		...LIVE,
	})
	const opnameQuery = useQuery({
		...opnameResource.list.queryOptions({ page: 1, limit: 20, locationId }),
		...LIVE,
	})

	// ponytail: the opname list filters one status at a time; draft + in-progress
	// are picked client-side from the latest 20 (one draft per location is a DB invariant).
	const activeOpnames = (opnameQuery.data?.data ?? [])
		.filter((o) => o.status === 'draft' || o.status === 'in_progress')
		.slice(0, PREVIEW)

	const count = (n: number | undefined, noun: string) =>
		n === undefined ? undefined : n === 0 ? `Tidak ada ${noun}` : `${n} ${noun}`

	return (
		<div className="space-y-6">
			{summary !== undefined && summary.negativeStockCount > 0 && (
				<InlineAlert variant="error">
					{summary.negativeStockCount} material bersaldo minus di lokasi ini. Periksa riwayat
					pergerakan atau lakukan opname.
				</InlineAlert>
			)}

			<div className="grid gap-6 lg:grid-cols-2">
				<Panel
					title="Stok menipis"
					description={count(summary?.lowStockCount, 'material di bawah minimum')}
					action={<ViewAll link={<Link to="/inventory/stock" />}>Lihat stok</ViewAll>}
					query={stockQuery}
					items={lowStock}
					getKey={(b) => b.materialId}
					errorMessage="Data stok tidak dapat dimuat."
					empty={{ title: 'Semua stok aman', description: 'Tidak ada material di bawah minimum.' }}
					renderItem={(b) => (
						<>
							<div className="min-w-0">
								<p className="truncate text-sm">{b.materialName}</p>
								<p className="font-mono text-xs text-muted-foreground">{b.materialCode}</p>
							</div>
							<p className="shrink-0 text-right font-mono text-xs tabular-nums">
								<span className={cn(Number(b.quantity) < 0 ? 'text-destructive' : 'text-warning')}>
									{qty(b.quantity)}
								</span>
								<span className="text-muted-foreground">
									{' / '}
									{qty(b.minStock ?? '0')} {b.uomCode}
								</span>
							</p>
						</>
					)}
				/>

				<Panel
					title="Transfer berjalan"
					description={count(summary?.transfersInTransit, 'transfer dalam perjalanan')}
					action={
						<ViewAll link={<Link to="/inventory/transfers" search={{ status: 'in_transit' }} />}>
							Lihat transfer
						</ViewAll>
					}
					query={transfersQuery}
					items={transfersQuery.data?.data ?? []}
					getKey={(t) => t.id}
					errorMessage="Data transfer tidak dapat dimuat."
					empty={{
						title: 'Tidak ada transfer berjalan',
						description: 'Semua transfer sudah diterima.',
					}}
					renderItem={(t) => {
						const incoming = t.toLocationId === locationId
						return (
							<>
								<div className="min-w-0">
									<p className="font-mono text-sm">{t.transferNo}</p>
									<p className="truncate text-xs text-muted-foreground">
										{incoming ? `Dari ${nameOf(t.fromLocationId)}` : `Ke ${nameOf(t.toLocationId)}`}
									</p>
								</div>
								<div className="shrink-0 text-right text-xs">
									<p>{incoming ? 'Masuk' : 'Keluar'}</p>
									<RelativeTime value={t.updatedAt} className="text-muted-foreground" />
								</div>
							</>
						)
					}}
				/>

				<Panel
					title="Penerimaan draft"
					description={count(summary?.draftReceivings, 'penerimaan menunggu konfirmasi')}
					action={
						<ViewAll link={<Link to="/inventory/receiving" search={{ status: 'draft' }} />}>
							Lihat penerimaan
						</ViewAll>
					}
					query={receivingQuery}
					items={receivingQuery.data?.data ?? []}
					getKey={(r) => r.id}
					errorMessage="Data penerimaan tidak dapat dimuat."
					empty={{
						title: 'Tidak ada penerimaan draft',
						description: 'Semua penerimaan sudah dikonfirmasi.',
					}}
					renderItem={(r) => (
						<>
							<p className="min-w-0 truncate font-mono text-sm">{r.receivingNo}</p>
							<RelativeTime
								value={r.createdAt}
								className="shrink-0 text-xs text-muted-foreground"
							/>
						</>
					)}
				/>

				<Panel
					title="Opname aktif"
					description={count(summary?.activeOpname, 'opname sedang berjalan')}
					action={<ViewAll link={<Link to="/inventory/opname" />}>Lihat opname</ViewAll>}
					query={opnameQuery}
					items={activeOpnames}
					getKey={(o) => o.id}
					errorMessage="Data opname tidak dapat dimuat."
					empty={{ title: 'Tidak ada opname berjalan' }}
					renderItem={(o) => (
						<>
							<p className="min-w-0 truncate font-mono text-sm">{o.opnameNo}</p>
							<RelativeTime
								value={o.startedAt ?? o.createdAt}
								className="shrink-0 text-xs text-muted-foreground"
							/>
						</>
					)}
				/>
			</div>
		</div>
	)
}
