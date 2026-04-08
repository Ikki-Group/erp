import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { ActivityIcon, CheckCircle2Icon, ClockIcon, DatabaseIcon, RefreshCwIcon, ServerIcon } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { CardStat } from '@/components/blocks/card/card-stat'
import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { BadgeDot } from '@/components/blocks/data-display/badge-dot'
import { ChartCard, ChartFooterContent, ChartGrid } from '@/components/blocks/data-display/chart-card'
import { Page } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { useDataTable } from '@/hooks/use-data-table'
import { toDateTimeStamp } from '@/lib/formatter'

export const Route = createFileRoute('/_app/moka/monitoring')({ component: MokaMonitoringPage })

// Mock Data
const syncActivityData = [
  { time: '00:00', count: 120 },
  { time: '04:00', count: 80 },
  { time: '08:00', count: 450 },
  { time: '12:00', count: 980 },
  { time: '16:00', count: 560 },
  { time: '20:00', count: 320 },
  { time: '23:59', count: 180 },
]

const activityConfig = { count: { label: 'Data Tersinkron', color: 'hsl(var(--primary))' } }

const mockLogs = [
  {
    id: 'LOG-10293',
    entity: 'Transactions',
    type: 'Incremental Sync',
    status: 'success',
    records: 145,
    timestamp: new Date().toISOString(),
  },
  {
    id: 'LOG-10292',
    entity: 'Inventory',
    type: 'Full Sync',
    status: 'success',
    records: 2040,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'LOG-10291',
    entity: 'Products',
    type: 'Incremental Sync',
    status: 'failed',
    records: 0,
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    error: 'API rate limit exceeded',
  },
  {
    id: 'LOG-10290',
    entity: 'Categories',
    type: 'Incremental Sync',
    status: 'success',
    records: 12,
    timestamp: new Date(Date.now() - 10800000).toISOString(),
  },
]

type LogType = (typeof mockLogs)[0]
const ch = createColumnHelper<LogType>()

const columns = [
  ch.accessor('timestamp', { header: 'Waktu', cell: ({ row }) => toDateTimeStamp(row.original.timestamp) }),
  ch.accessor('entity', {
    header: 'Entitas Data',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <DatabaseIcon className="h-3 w-3 text-muted-foreground" />
        <span className="font-medium">{row.original.entity}</span>
      </div>
    ),
  }),
  ch.accessor('type', { header: 'Jenis Proses' }),
  ch.accessor('records', { header: 'Jumlah Record', cell: ({ row }) => row.original.records.toLocaleString() }),
  ch.accessor('status', {
    header: 'Status',
    cell: ({ row }) => {
      if (row.original.status === 'success') {
        return <BadgeDot variant="success-outline">Berhasil</BadgeDot>
      }
      return (
        <div className="flex items-center gap-2">
          <BadgeDot variant="destructive-outline">Gagal</BadgeDot>
          <span className="text-[10px] text-destructive truncate max-w-[100px]">{row.original.error}</span>
        </div>
      )
    },
  }),
]

function MokaMonitoringPage() {
  const table = useDataTable({
    columns,
    data: mockLogs,
    pageCount: 1,
    rowCount: mockLogs.length,
    ds: { pagination: { limit: 10, page: 1 }, search: '', filters: {} } as any,
  })

  return (
    <Page>
      <Page.BlockHeader
        title="Monitoring Moka"
        description="Pantau status integrasi, sinkronisasi data pipeline, dan log transaksi real-time dari Moka POS."
        action={
          <Button size="sm">
            <RefreshCwIcon className="mr-2 h-4 w-4" /> Sinkronkan Sekarang
          </Button>
        }
      />

      <Page.Content className="mt-2">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
          <CardStat title="Pipeline Status" value="Running" icon={ServerIcon} />
          <CardStat title="Total Data (Hari Ini)" value="2,345 Records" icon={ActivityIcon} />
          <CardStat title="Sync Berhasil" value="98.5%" icon={CheckCircle2Icon} />
          <CardStat title="Sync Terakhir" value="2 Menit Lalu" icon={ClockIcon} />
        </div>

        <ChartGrid className="grid-cols-1 lg:grid-cols-3 mb-4">
          <ChartCard
            className="lg:col-span-3"
            title="Aktivitas Sinkronisasi"
            description="Volume data yang ditarik dari Moka per jam"
            footer={
              <ChartFooterContent
                trend="up"
                trendValue="Puncak sinkronisasi pada pukul 12:00"
                description="Real-time monitoring 24 jam terakhir"
              />
            }
          >
            <ChartContainer config={activityConfig} className="h-[250px] w-full">
              <AreaChart data={syncActivityData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillActivity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-count)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                <Area
                  dataKey="count"
                  type="natural"
                  fill="url(#fillActivity)"
                  fillOpacity={0.4}
                  stroke="var(--color-count)"
                />
              </AreaChart>
            </ChartContainer>
          </ChartCard>
        </ChartGrid>

        <DataTableCard title="Sync Logs" table={table as any} isLoading={false} recordCount={mockLogs.length} />
      </Page.Content>
    </Page>
  )
}
