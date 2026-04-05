import { createFileRoute } from '@tanstack/react-router'
import {
  AlertCircleIcon,
  ArrowRightIcon,
  BoxIcon,
  CheckCircle2Icon,
  DollarSignIcon,
  PackageIcon,
  TrendingUpIcon,
} from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { CardStat } from '@/components/card/card-stat'
import { ChartCard, ChartFooterContent, ChartGrid } from '@/components/common/data-display/chart-card'
import { Page } from '@/components/layout/page'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export const Route = createFileRoute('/_app/')({ component: Dashboard })

// Mock Data for a "Premium" feel
const revenueData = [
  { day: 'Sen', revenue: 4500000, cost: 2100000 },
  { day: 'Sel', revenue: 5200000, cost: 2400000 },
  { day: 'Rab', revenue: 4800000, cost: 2200000 },
  { day: 'Kam', revenue: 6100000, cost: 2800000 },
  { day: 'Jum', revenue: 7500000, cost: 3500000 },
  { day: 'Sab', revenue: 9200000, cost: 4200000 },
  { day: 'Min', revenue: 8800000, cost: 4000000 },
]

const revenueConfig = {
  revenue: { label: 'Pendapatan', color: 'oklch(var(--primary))' },
  cost: { label: 'COGS (HPP)', color: 'oklch(var(--chart-2))' },
}

const topProductsData = [
  { name: 'Ikki Signature Coffee', sales: 450 },
  { name: 'Nasi Goreng Spesial', sales: 380 },
  { name: 'Croissant Butter', sales: 320 },
  { name: 'Iced Lychee Tea', sales: 290 },
  { name: 'Spaghetti Carbonara', sales: 240 },
]

const productConfig = {
  sales: { label: 'Terjual', color: 'oklch(var(--primary))' },
}

const lowStockData = [
  { item: 'Biji Kopi House Blend', location: 'Ikki Coffee Bar', stock: '2.5 kg', min: '5 kg' },
  { item: 'Susu Fresh Milk', location: 'Gudang Utama', stock: '12 L', min: '24 L' },
  { item: 'Sirup Karamel', location: 'Ikki Resto', stock: '2 btl', min: '5 btl' },
]

const pendingRequests = [
  { id: 'REQ-001', from: 'Ikki Coffee', item: 'Paper Cup 8oz', qty: '500 pcs', status: 'Pending Approval' },
  { id: 'REQ-002', from: 'Ikki Resto', item: 'T-Bone Steak', qty: '10 kg', status: 'Waiting Stock' },
]

function Dashboard() {
  return (
    <Page>
      <Page.BlockHeader
        title="Dashboard Utama"
        description="Pantau performa bisnis real-time dari seluruh outlet Ikki Group."
      />

      <Page.Content className="mt-2 space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <CardStat
            title="Pendapatan (Hari Ini)"
            value="Rp 8.800.000"
            description="+15% vs kemarin"
            icon={DollarSignIcon}
            className="border-primary/20 bg-primary/5"
          />
          <CardStat
            title="Total HPP (COGS)"
            value="Rp 4.000.000"
            description="45.4% Margin"
            icon={PackageIcon}
          />
          <CardStat
            title="Gross Profit Margin"
            value="54.6%"
            description="Trend naik 2.1%"
            icon={TrendingUpIcon}
            className="text-success"
          />
          <CardStat
            title="Stok Menipis"
            value="12 Item"
            description="Butuh restock"
            icon={AlertCircleIcon}
            className="text-destructive"
          />
        </div>

        {/* Charts Section */}
        <ChartGrid className="grid-cols-1 lg:grid-cols-3">
          <ChartCard
            className="lg:col-span-2"
            title="Tren Pendapatan 7 Hari Terakhir"
            description="Performa akumulasi seluruh outlet"
            footer={
              <ChartFooterContent
                trend="up"
                trendValue="Naik 18% minggu ini"
                description="Peak sales pada hari Sabtu & Minggu"
              />
            }
          >
            <ChartContainer config={revenueConfig} className="aspect-auto h-[350px] w-full">
              <AreaChart data={revenueData} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="oklch(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis hide />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                <Area
                  dataKey="revenue"
                  type="monotone"
                  fill="url(#fillRev)"
                  stroke="oklch(var(--primary))"
                  strokeWidth={2}
                />
                <Area
                  dataKey="cost"
                  type="monotone"
                  fill="transparent"
                  stroke="oklch(var(--chart-2))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          </ChartCard>

          <ChartCard title="Produk Terlaris" description="Berdasarkan volume penjualan">
            <ChartContainer config={productConfig} className="aspect-auto h-[350px] w-full">
              <BarChart data={topProductsData} layout="vertical" margin={{ left: -20 }}>
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  width={140}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="sales" fill="oklch(var(--primary))" radius={4} />
              </BarChart>
            </ChartContainer>
          </ChartCard>
        </ChartGrid>

        {/* Action Panels */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 pb-10">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6 pb-3 flex items-center justify-between">
              <h3 className="font-semibold leading-none tracking-tight">Peringatan Stok Rendah</h3>
              <Button variant="ghost" size="sm" className="text-xs">Lihat Semua</Button>
            </div>
            <div className="px-6 pb-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Lokasi</TableHead>
                    <TableHead className="text-right">Stok</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockData.map((row) => (
                    <TableRow key={row.item}>
                      <TableCell className="font-medium">{row.item}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{row.location}</TableCell>
                      <TableCell className="text-right text-destructive font-semibold">
                        {row.stock} <span className="text-[10px] text-muted-foreground">/ {row.min}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6 pb-3 flex items-center justify-between">
              <h3 className="font-semibold leading-none tracking-tight">Menunggu Persetujuan</h3>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                {pendingRequests.length} Aktif
              </Badge>
            </div>
            <div className="px-6 pb-6 space-y-4">
              {pendingRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/50 hover:bg-muted transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-background border shadow-sm">
                      <BoxIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="grid gap-0.5">
                      <p className="text-sm font-medium leading-none">{req.item}</p>
                      <p className="text-xs text-muted-foreground">{req.from} • {req.qty}</p>
                    </div>
                  </div>
                  <ArrowRightIcon className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
              <Button variant="outline" className="w-full text-xs gap-2">
                <CheckCircle2Icon className="h-4 w-4" /> Buka Panel Approval
              </Button>
            </div>
          </div>
        </div>

      </Page.Content>
    </Page>
  )
}
