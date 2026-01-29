import { createFileRoute } from '@tanstack/react-router'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  ArrowUpRight,
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/_auth/')({
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, here's what's happening today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Download
          </Button>
          <Button size="sm">Create New</Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value="$45,231"
          description="+20.1% month"
          icon={DollarSign}
          trend="up"
        />
        <StatCard
          title="Subscriptions"
          value="+2,350"
          description="+180.1% month"
          icon={Users}
          trend="up"
        />
        <StatCard
          title="Sales"
          value="+12,234"
          description="+19% month"
          icon={ShoppingCart}
          trend="up"
        />
        <StatCard
          title="Active Now"
          value="+573"
          description="+201 since hour"
          icon={TrendingUp}
          trend="up"
        />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        <Card className="lg:col-span-4 shadow-sm border-none bg-card/40 backdrop-blur-sm">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-lg">Overview</CardTitle>
            <CardDescription>Monthly sales performance.</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px] md:h-[300px] flex items-center justify-center border-t border-dashed mt-2 px-4">
            <span className="text-muted-foreground text-sm lowercase italic">
              Chart visualization would go here
            </span>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 shadow-sm border-none bg-card/40 backdrop-blur-sm">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-lg">Recent Sales</CardTitle>
            <CardDescription>You made 265 sales this month.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="space-y-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-medium">JD</span>
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="text-sm font-medium leading-none truncate">
                      Olivia Martin
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      olivia.martin@email.com
                    </p>
                  </div>
                  <div className="font-medium text-sm">$1,999</div>
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-6 text-muted-foreground hover:text-foreground"
            >
              View All <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Alerts */}
      <Card className="shadow-sm border-none bg-card/40 backdrop-blur-sm overflow-hidden">
        <CardHeader className="p-4 md:p-6 pb-2">
          <CardTitle className="text-lg">Inventory Alerts</CardTitle>
          <CardDescription>Products running low on stock.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm border-collapse">
              <thead className="bg-muted/10">
                <tr className="transition-colors hover:bg-muted/10">
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                    Product
                  </th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground text-center">
                    Status
                  </th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground text-right">
                    Stock
                  </th>
                  <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y border-t border-border/50">
                {[
                  { name: 'Coffee Beans (Ethiopia)', stock: 12, status: 'low' },
                  { name: 'Paper Cups (12oz)', stock: 5, status: 'critical' },
                  { name: 'Milk (Whole)', stock: 24, status: 'normal' },
                ].map((item, i) => (
                  <tr
                    key={i}
                    className="transition-colors hover:bg-muted/50 border-border/50"
                  >
                    <td className="p-3 md:p-4 align-middle font-medium truncate max-w-[150px] sm:max-w-none">
                      {item.name}
                    </td>
                    <td className="p-3 md:p-4 align-middle text-center">
                      <Badge
                        size="xs"
                        variant={
                          item.status === 'critical'
                            ? 'destructive'
                            : item.status === 'low'
                              ? 'outline'
                              : 'secondary'
                        }
                      >
                        {item.status}
                      </Badge>
                    </td>
                    <td className="p-3 md:p-4 align-middle text-right font-mono text-xs">
                      {item.stock}
                    </td>
                    <td className="p-3 md:p-4 align-middle text-right">
                      <Button variant="ghost" size="icon-xs">
                        <ArrowUpRight className="size-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ title, value, description, icon: Icon, trend }: any) {
  return (
    <Card className="shadow-sm border-none bg-card/40 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          {trend === 'up' ? (
            <TrendingUp className="h-3 w-3 text-emerald-500" />
          ) : (
            <TrendingDown className="h-3 w-3 text-destructive" />
          )}
          {description}
        </p>
      </CardContent>
    </Card>
  )
}
