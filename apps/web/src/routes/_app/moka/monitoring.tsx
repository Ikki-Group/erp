import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { ActivityIcon, CheckCircle2Icon, ClockIcon, DatabaseIcon } from 'lucide-react'

import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

import { CardStat } from '@/components/blocks/card/card-stat'
import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { BadgeDot } from '@/components/blocks/data-display/badge-dot'
import { Page } from '@/components/layout/page'
import {
	createColumnHelper,
	dateColumn,
	statusColumn,
} from '@/components/reui/data-grid/data-grid-columns'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'

import { mokaApi } from '@/features/moka/api/moka.api'
import type { MokaScrapHistoryDto } from '@/features/moka/dto/moka-scrap-history.dto'

export const Route = createFileRoute('/_app/moka/monitoring')({ component: MokaMonitoringPage })

const ch = createColumnHelper<MokaScrapHistoryDto>()

const columns = [
	ch.accessor('startedAt', dateColumn({ header: 'Waktu', size: 160 })),
	ch.accessor(
		'type',
		statusColumn({
			header: 'Tipe Sync',
			render: (value) => (
				<div className="flex items-center gap-2">
					<DatabaseIcon className="h-3 w-3 text-muted-foreground" />
					<span className="font-medium capitalize">{value}</span>
				</div>
			),
			size: 140,
		}),
	),
	ch.accessor(
		'triggerMode',
		statusColumn({
			header: 'Trigger',
			render: (value) => <span className="capitalize">{value}</span>,
			size: 120,
		}),
	),
	ch.accessor(
		'recordsCount',
		statusColumn({
			header: 'Jumlah Record',
			render: (value) => (
				<span className="tabular-nums font-mono">{Number(value).toLocaleString()}</span>
			),
			size: 130,
		}),
	),
	ch.accessor(
		'status',
		statusColumn({
			header: 'Status',
			render: (value, row) => {
				if (value === 'completed') {
					return <BadgeDot variant="success-outline">Berhasil</BadgeDot>
				}
				if (value === 'processing' || value === 'pending') {
					return <BadgeDot variant="default">Sedang Proses</BadgeDot>
				}
				return (
					<div className="flex items-center gap-2">
						<BadgeDot variant="destructive-outline">Gagal</BadgeDot>
						<span className="text-[10px] text-destructive truncate max-w-25">
							{row.errorMessage ?? 'Unknown error'}
						</span>
					</div>
				)
			},
			size: 160,
		}),
	),
]

function MokaMonitoringPage() {
	const { data: history, isLoading } = useQuery({
		queryKey: ['moka-scrap-history'],
		queryFn: () => mokaApi.scrapHistory.fetch({ params: {} }),
	})

	const logs = history?.data ?? []

	const ds = useDataTableState()
	const table = useDataTable({
		columns,
		data: logs,
		pageCount: 1,
		rowCount: logs.length,
		ds,
	})

	const completedCount = logs.filter((l: MokaScrapHistoryDto) => l.status === 'completed').length
	const lastSync = logs[0]?.finishedAt ?? null
	const totalRecords = logs.reduce((sum: number, l: MokaScrapHistoryDto) => sum + l.recordsCount, 0)

	return (
		<Page size="xl">
			<Page.BlockHeader
				title="Monitoring Moka"
				description="Pantau status integrasi, sinkronisasi data pipeline, dan log transaksi real-time dari Moka POS."
			/>

			<Page.Content className="mt-2">
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
					<CardStat title="Total Sync" value={`${logs.length} Kali`} icon={ActivityIcon} />
					<CardStat
						title="Total Data"
						value={`${totalRecords.toLocaleString()} Records`}
						icon={DatabaseIcon}
					/>
					<CardStat
						title="Sync Berhasil"
						value={`${logs.length > 0 ? ((completedCount / logs.length) * 100).toFixed(1) : 0}%`}
						icon={CheckCircle2Icon}
					/>
					<CardStat
						title="Sync Terakhir"
						value={
							lastSync
								? `${Math.floor((Date.now() - new Date(lastSync).getTime()) / 60000)} Menit Lalu`
								: '-'
						}
						icon={ClockIcon}
					/>
				</div>

				<DataTableCard
					title="Sync Logs"
					table={table}
					isLoading={isLoading}
					recordCount={logs.length}
					toolbar={
						<DataGridFilter ds={ds} options={[{ type: 'search', placeholder: 'Cari log...' }]} />
					}
				/>
			</Page.Content>
		</Page>
	)
}
