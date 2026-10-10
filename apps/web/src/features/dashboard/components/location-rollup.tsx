import { EmptyState, PageError, PageSection } from '@/components/shared'

import { Skeleton } from '@/components/ui/skeleton'
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'

import type { InventoryLocationSummaryDto } from '../api.ts'
import { METRICS, NEGATIVE_METRIC, PRIMARY_METRICS } from '../metrics.ts'
import type { MetricKey } from '../metrics.ts'
import { CountLink, CountValue } from './count-link.tsx'

interface LocationRollupProps {
	rows: InventoryLocationSummaryDto[] | undefined
	query: {
		isLoading: boolean
		isError: boolean
		refetch: () => unknown
	}
	/**
	 * Distinct in-transit transfers. Summing the per-location column would
	 * count every transfer twice (once at each end).
	 */
	transfersTotal: number | undefined
}

type Totals = Record<MetricKey, number | undefined>

function totalsOf(rows: InventoryLocationSummaryDto[], transfersTotal: number | undefined): Totals {
	const sum = (key: MetricKey) => rows.reduce((acc, row) => acc + row[key], 0)
	return {
		lowStockCount: sum('lowStockCount'),
		negativeStockCount: sum('negativeStockCount'),
		transfersInTransit: transfersTotal,
		activeOpname: sum('activeOpname'),
		draftReceivings: sum('draftReceivings'),
	}
}

function TotalCell({ value, metricKey }: { value: number | undefined; metricKey: MetricKey }) {
	const metric = METRICS.find((m) => m.key === metricKey)!
	if (value === undefined) return <Skeleton className="ml-auto h-4 w-6" />
	return <CountValue value={value} metric={metric} />
}

/** Consolidated view: one row per accessible location, each count drilling into that location. */
export function LocationRollup({ rows: data, query, transfersTotal }: LocationRollupProps) {
	const rows = data ?? []
	const totals = totalsOf(rows, transfersTotal)

	return (
		<PageSection
			title="Ringkasan per lokasi"
			description="Pilih angka untuk beralih ke lokasi tersebut dan membuka daftarnya."
			className="space-y-2"
		>
			<div className="overflow-hidden rounded-lg border bg-card">
				{query.isLoading ? (
					<div className="divide-y" aria-busy="true">
						{[0, 1, 2].map((i) => (
							<div key={i} className="flex items-center justify-between gap-4 px-4 py-3">
								<Skeleton className="h-4 w-36" />
								<Skeleton className="h-4 w-48" />
							</div>
						))}
					</div>
				) : query.isError ? (
					<PageError
						className="py-6"
						title="Gagal memuat ringkasan"
						message="Ringkasan stok per lokasi tidak dapat dimuat."
						onRetry={() => void query.refetch()}
					/>
				) : rows.length === 0 ? (
					<EmptyState
						className="py-6"
						title="Belum ada lokasi"
						description="Tidak ada lokasi aktif yang dapat Anda akses."
					/>
				) : (
					<>
						{/* ≥ md: table */}
						<Table className="hidden md:table">
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="px-4 text-muted-foreground">Lokasi</TableHead>
									{METRICS.map((m) => (
										<TableHead key={m.key} className="text-right text-muted-foreground last:pr-4">
											{m.label}
										</TableHead>
									))}
								</TableRow>
							</TableHeader>
							<TableBody>
								{rows.map((row) => (
									<TableRow key={row.id}>
										<TableCell className="px-4">
											<span className="font-medium">{row.name}</span>
											<span className="ml-2 font-mono text-muted-foreground">{row.code}</span>
										</TableCell>
										{METRICS.map((m) => (
											<TableCell key={m.key} className="text-right last:pr-4">
												<CountLink value={row[m.key]} metric={m} location={row} />
											</TableCell>
										))}
									</TableRow>
								))}
							</TableBody>
							<TableFooter className="bg-muted/40">
								<TableRow className="hover:bg-transparent">
									<TableCell className="px-4 text-muted-foreground">Total</TableCell>
									{METRICS.map((m) => (
										<TableCell key={m.key} className="text-right last:pr-4">
											<TotalCell value={totals[m.key]} metricKey={m.key} />
										</TableCell>
									))}
								</TableRow>
							</TableFooter>
						</Table>

						{/* < md: stacked rows, name then a 2×2 grid */}
						<ul className="divide-y md:hidden">
							{rows.map((row) => (
								<li key={row.id} className="space-y-2 px-4 py-3">
									<div className="flex items-baseline justify-between gap-3">
										<p className="text-sm font-medium">
											{row.name}
											<span className="ml-2 font-mono text-xs text-muted-foreground">
												{row.code}
											</span>
										</p>
										{row.negativeStockCount > 0 && (
											<span className="text-xs text-destructive">
												<CountLink
													value={row.negativeStockCount}
													metric={NEGATIVE_METRIC}
													location={row}
												/>{' '}
												stok minus
											</span>
										)}
									</div>
									<dl className="grid grid-cols-2 gap-x-4 gap-y-1">
										{PRIMARY_METRICS.map((m) => (
											<div key={m.key} className="flex items-center justify-between gap-2 text-xs">
												<dt className="text-muted-foreground">{m.label}</dt>
												<dd>
													<CountLink value={row[m.key]} metric={m} location={row} />
												</dd>
											</div>
										))}
									</dl>
								</li>
							))}
							<li className="space-y-2 bg-muted/40 px-4 py-3">
								<p className="text-xs text-muted-foreground">Total semua lokasi</p>
								<dl className="grid grid-cols-2 gap-x-4 gap-y-1">
									{PRIMARY_METRICS.map((m) => (
										<div key={m.key} className="flex items-center justify-between gap-2 text-xs">
											<dt className="text-muted-foreground">{m.label}</dt>
											<dd>
												<TotalCell value={totals[m.key]} metricKey={m.key} />
											</dd>
										</div>
									))}
								</dl>
							</li>
						</ul>
					</>
				)}
			</div>
		</PageSection>
	)
}
