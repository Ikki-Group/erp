import { createFileRoute } from '@tanstack/react-router'
import { BoxIcon, DollarSignIcon, FactoryIcon, ShoppingCartIcon, TrendingUpIcon } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

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

export const Route = createFileRoute('/_app/')({ component: Dashboard })

// Mock Data
const revenueData = [
  { month: 'Jan', revenue: 186000000, cost: 80000000 },
  { month: 'Feb', revenue: 305000000, cost: 120000000 },
  { month: 'Mar', revenue: 237000000, cost: 95000000 },
  { month: 'Apr', revenue: 573000000, cost: 210000000 },
  { month: 'May', revenue: 409000000, cost: 160000000 },
  { month: 'Jun', revenue: 614000000, cost: 280000000 },
]

const revenueConfig = {
  revenue: { label: 'Pendapatan', color: 'hsl(var(--primary))' },
  cost: { label: 'Beban Operasional', color: 'hsl(var(--chart-2))' },
}

const inventoryData = [
  { category: 'Bahan Jadi', value: 450000000 },
  { category: 'Setengah Jadi', value: 120000000 },
  { category: 'Bahan Baku', value: 310000000 },
]

const inventoryConfig = {
  value: { label: 'Nilai (Rp)', color: 'hsl(var(--chart-1))' },
  category: { label: 'Kategori' },
}

function Dashboard() {
  return (
    <Page>
      <Page.BlockHeader
        title="Dashboard Overview"
        description="Ringkasan performa finansial, inventori, dan produksi harian Anda."
      />

      <Page.Content className="mt-2">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
          <CardStat title="Pendapatan (Bln Ini)" value="Rp 614.000.000" icon={DollarSignIcon} />
          <CardStat title="Pesanan Baru" value="145" icon={ShoppingCartIcon} />
          <CardStat title="Total Nilai Inventori" value="Rp 880.000.000" icon={BoxIcon} />
          <CardStat title="Work Order Aktif" value="24" icon={FactoryIcon} />
        </div>

        <ChartGrid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <ChartCard
            className="lg:col-span-2"
            title="Performa Keuangan"
            description="Januari - Juni 2026"
            footer={
              <ChartFooterContent
                trend="up"
                trendValue="Naik 12.5% bulan ini"
                trendIcon={<TrendingUpIcon className="h-4 w-4" />}
                description="Berdasarkan performa 6 bulan terakhir"
              />
            }
          >
            <ChartContainer config={revenueConfig}>
              <AreaChart data={revenueData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="fillCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-cost)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-cost)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Area
                  dataKey="cost"
                  type="natural"
                  fill="url(#fillCost)"
                  fillOpacity={0.4}
                  stroke="var(--color-cost)"
                />
                <Area
                  dataKey="revenue"
                  type="natural"
                  fill="url(#fillRev)"
                  fillOpacity={0.4}
                  stroke="var(--color-revenue)"
                />
              </AreaChart>
            </ChartContainer>
          </ChartCard>

          <ChartCard
            title="Valuasi Inventori"
            description="Distribusi nilai barang"
            footer={
              <ChartFooterContent
                trend="up"
                trendValue="Didominasi Barang Jadi (51%)"
                description="Real-time valuasi di semua lokasi"
              />
            }
          >
            <ChartContainer config={inventoryConfig}>
              <BarChart data={inventoryData} layout="vertical">
                <CartesianGrid horizontal={false} />
                <YAxis
                  dataKey="category"
                  type="category"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  width={100}
                />
                <XAxis dataKey="value" type="number" hide />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="var(--color-value)" radius={4} />
              </BarChart>
            </ChartContainer>
          </ChartCard>
        </ChartGrid>
      </Page.Content>
    </Page>
  )
}
