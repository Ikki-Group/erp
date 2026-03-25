import { createFileRoute } from '@tanstack/react-router'
import { ArrowDownRightIcon, ArrowUpRightIcon, BoxIcon, RefreshCcwIcon, TrendingUpIcon } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'

import { CardStat } from '@/components/card/card-stat'
import { ChartCard, ChartFooterContent, ChartGrid } from '@/components/common/data-display/chart-card'
import { Page } from '@/components/layout/page'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

export const Route = createFileRoute('/_app/analytics/stock')({ component: AnalyticsStockPage })

// Mock Data
const stockMovementData = [
  { month: 'Jan', masuk: 12000, keluar: 8000 },
  { month: 'Feb', masuk: 15000, keluar: 13000 },
  { month: 'Mar', masuk: 11000, keluar: 12000 },
  { month: 'Apr', masuk: 18000, keluar: 14000 },
  { month: 'May', masuk: 16000, keluar: 17000 },
  { month: 'Jun', masuk: 21000, keluar: 19000 },
]

const movementConfig = {
  masuk: { label: 'Barang Masuk', color: 'hsl(var(--chart-2))' },
  keluar: { label: 'Barang Keluar', color: 'hsl(var(--chart-5))' },
}

const locationStockData = [
  { location: 'Gudang Pusat', qty: 45000 },
  { location: 'Outlet Jakarta', qty: 12000 },
  { location: 'Outlet Bandung', qty: 8500 },
  { location: 'Gudang Transit', qty: 15000 },
]

const locationConfig = { qty: { label: 'Kuantitas', color: 'hsl(var(--primary))' }, location: { label: 'Lokasi' } }

function AnalyticsStockPage() {
  return (
    <Page>
      <Page.BlockHeader
        title="Laporan Stok"
        description="Analisis pergerakan stok, tren barang masuk/keluar, dan distribusi per lokasi."
      />

      <Page.Content className="mt-2">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
          <CardStat title="Total Stok Saat Ini" value="80,500" icon={BoxIcon} />
          <CardStat title="Barang Masuk (Bln Ini)" value="+21,000" icon={ArrowDownRightIcon} />
          <CardStat title="Barang Keluar (Bln Ini)" value="-19,000" icon={ArrowUpRightIcon} />
          <CardStat title="Turnover Rate" value="28%" icon={RefreshCcwIcon} />
        </div>

        <ChartGrid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
          <ChartCard
            className="lg:col-span-3"
            title="Tren Pergerakan Stok"
            description="Perbandingan barang masuk vs keluar selama 6 bulan terakhir"
            footer={
              <ChartFooterContent
                trend="up"
                trendValue="Pertumbuhan stok positif (+2,000 unit)"
                trendIcon={<TrendingUpIcon className="h-4 w-4" />}
                description="Bulan Juni 2026"
              />
            }
          >
            <ChartContainer config={movementConfig}>
              <LineChart data={stockMovementData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  dataKey="masuk"
                  type="monotone"
                  stroke="var(--color-masuk)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  dataKey="keluar"
                  type="monotone"
                  stroke="var(--color-keluar)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          </ChartCard>

          <ChartCard
            className="lg:col-span-2"
            title="Distribusi per Lokasi"
            description="Top 4 lokasi dengan stok terbanyak"
            footer={
              <ChartFooterContent
                trend="up"
                trendValue="Gudang Pusat mendominasi (55%)"
                description="Data real-time saat ini"
              />
            }
          >
            <ChartContainer config={locationConfig}>
              <BarChart data={locationStockData} layout="vertical">
                <CartesianGrid horizontal={false} />
                <YAxis
                  dataKey="location"
                  type="category"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  width={100}
                />
                <XAxis dataKey="qty" type="number" hide />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                <Bar dataKey="qty" fill="var(--color-qty)" radius={4} />
              </BarChart>
            </ChartContainer>
          </ChartCard>
        </ChartGrid>
      </Page.Content>
    </Page>
  )
}
