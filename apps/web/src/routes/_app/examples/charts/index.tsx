import {
  Page,
  PageContent,
  PageDescription,
  PageHeader,
  PageTitle,
  PageTitleContainer,
} from '@/components/layout/page'
import {
  ChartCard,
  ChartGrid,
  ChartFooterContent,
} from '@/components/common/data-display/chart-card'
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createFileRoute } from '@tanstack/react-router'
import { TrendingUpIcon } from 'lucide-react'
import { useState, useMemo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  XAxis,
  YAxis,
  Label,
} from 'recharts'

export const Route = createFileRoute('/_app/examples/charts/')({
  component: ChartsPage,
})

// --- 1. Revenue Config (Area Chart with Filter) ---
const revenueDataFull = [
  { month: 'Jan', revenue: 186000, profit: 80000 },
  { month: 'Feb', revenue: 305000, profit: 120000 },
  { month: 'Mar', revenue: 237000, profit: 95000 },
  { month: 'Apr', revenue: 573000, profit: 210000 },
  { month: 'May', revenue: 409000, profit: 160000 },
  { month: 'Jun', revenue: 614000, profit: 280000 },
  { month: 'Jul', revenue: 450000, profit: 190000 },
  { month: 'Aug', revenue: 520000, profit: 230000 },
  { month: 'Sep', revenue: 480000, profit: 200000 },
  { month: 'Oct', revenue: 590000, profit: 260000 },
  { month: 'Nov', revenue: 650000, profit: 300000 },
  { month: 'Dec', revenue: 720000, profit: 340000 },
]

const revenueConfig = {
  revenue: {
    label: 'Revenue',
    color: 'hsl(var(--primary))',
  },
  profit: {
    label: 'Profit',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig

// --- 2. Consolidation Config (Stacked/Grouped Bar) ---
const consolidationData = [
  { month: 'Jan', jakarta: 4500, surabaya: 2300, bali: 3100 },
  { month: 'Feb', jakarta: 5200, surabaya: 2800, bali: 3400 },
  { month: 'Mar', jakarta: 4900, surabaya: 2600, bali: 3200 },
  { month: 'Apr', jakarta: 5800, surabaya: 3100, bali: 4500 },
  { month: 'May', jakarta: 6100, surabaya: 3400, bali: 4200 },
  { month: 'Jun', jakarta: 6700, surabaya: 3800, bali: 4800 },
]

const consolidationConfig = {
  jakarta: {
    label: 'Jakarta HQ',
    color: 'hsl(var(--chart-1))',
  },
  surabaya: {
    label: 'Surabaya Branch',
    color: 'hsl(var(--chart-2))',
  },
  bali: {
    label: 'Bali Hub',
    color: 'hsl(var(--chart-3))',
  },
} satisfies ChartConfig

// --- 3. Order Status (Donut Chart) ---
const statusData = [
  { status: 'completed', count: 245, fill: 'hsl(var(--chart-2))' }, // Emerald/Green-ish
  { status: 'pending', count: 120, fill: 'hsl(var(--chart-4))' }, // Orange/Yellow-ish
  { status: 'cancelled', count: 45, fill: 'hsl(var(--chart-5))' }, // Red/Rose
]

const statusConfig = {
  count: { label: 'Orders' },
  completed: { label: 'Completed', color: 'hsl(var(--chart-2))' },
  pending: { label: 'Pending', color: 'hsl(var(--chart-4))' },
  cancelled: { label: 'Cancelled', color: 'hsl(var(--chart-5))' },
} satisfies ChartConfig

function ChartsPage() {
  const [timeRange, setTimeRange] = useState('90d')

  const filteredRevenueData = useMemo(() => {
    if (timeRange === '30d')
      return revenueDataFull.slice(revenueDataFull.length - 2)
    if (timeRange === '90d')
      return revenueDataFull.slice(revenueDataFull.length - 6)
    return revenueDataFull
  }, [timeRange])

  return (
    <Page>
      <PageHeader sticky>
        <PageTitleContainer>
          <PageTitle>Data Visualization</PageTitle>
          <PageDescription>
            Interactive charts with filtering, legends, and advanced layouts.
          </PageDescription>
        </PageTitleContainer>
      </PageHeader>
      <PageContent>
        <ChartGrid>
          {/* 1. Interactive Revenue Chart */}
          <ChartCard
            title="Revenue & Profit"
            description="Financial performance over time."
            action={
              <Select
                value={timeRange}
                onValueChange={(val) => val && setTimeRange(val)}
              >
                <SelectTrigger
                  className="w-[120px] h-8 text-xs font-medium"
                  aria-label="Select time range"
                >
                  <SelectValue placeholder="Last 3 months" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="90d">Last 6 months</SelectItem>
                  <SelectItem value="30d">Last 2 months</SelectItem>
                  <SelectItem value="1y">Year to Date</SelectItem>
                </SelectContent>
              </Select>
            }
            footer={
              <ChartFooterContent
                trend="up"
                trendValue="Trending up by 5.2% this month"
                trendIcon={<TrendingUpIcon className="h-4 w-4" />}
                description="Jan - Jun 2024"
              />
            }
          >
            <ChartContainer config={revenueConfig}>
              <AreaChart
                accessibilityLayer
                data={filteredRevenueData}
                margin={{ left: 0, right: 0, top: 10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-revenue)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-revenue)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  <linearGradient id="fillProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-profit)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-profit)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Area
                  dataKey="profit"
                  type="natural"
                  fill="url(#fillProfit)"
                  fillOpacity={0.4}
                  stroke="var(--color-profit)"
                  stackId="a"
                />
                <Area
                  dataKey="revenue"
                  type="natural"
                  fill="url(#fillRevenue)"
                  fillOpacity={0.4}
                  stroke="var(--color-revenue)"
                  stackId="a"
                />
              </AreaChart>
            </ChartContainer>
          </ChartCard>

          {/* 2. Order Status Distribution */}
          <ChartCard
            title="Order Status"
            description="real-time order distribution"
            footer={
              <ChartFooterContent
                trend="up"
                trendValue="Completion rate is up 2.4%"
                trendIcon={<TrendingUpIcon className="h-4 w-4" />}
                description="Based on recent 400 orders"
              />
            }
          >
            <ChartContainer
              config={statusConfig}
              className="mx-auto aspect-square max-h-[300px]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={60}
                  strokeWidth={5}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-3xl font-bold"
                            >
                              {statusData
                                .reduce((acc, cur) => acc + cur.count, 0)
                                .toLocaleString()}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground text-xs"
                            >
                              Total Orders
                            </tspan>
                          </text>
                        )
                      }
                    }}
                  />
                </Pie>
                <ChartLegend
                  content={<ChartLegendContent nameKey="status" />}
                  className="-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center"
                />
              </PieChart>
            </ChartContainer>
          </ChartCard>

          {/* 3. Consolidated Performance (Multi-Location Bar Chart) */}
          <ChartCard
            className="col-span-2"
            title="Consolidated Performance"
            description="Comparing total output across all major locations."
            footer={
              <ChartFooterContent
                trend="up"
                trendValue="Jakarta leading by 15% in Q2"
                trendIcon={<TrendingUpIcon className="h-4 w-4" />}
                description="Showing total output for all branches"
              />
            }
          >
            <ChartContainer config={consolidationConfig}>
              <BarChart accessibilityLayer data={consolidationData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={10} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dashed" />}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="jakarta" fill="var(--color-jakarta)" radius={4} />
                <Bar
                  dataKey="surabaya"
                  fill="var(--color-surabaya)"
                  radius={4}
                />
                <Bar dataKey="bali" fill="var(--color-bali)" radius={4} />
              </BarChart>
            </ChartContainer>
          </ChartCard>
        </ChartGrid>
      </PageContent>
    </Page>
  )
}
