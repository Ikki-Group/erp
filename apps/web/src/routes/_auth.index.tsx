import { createFileRoute } from '@tanstack/react-router'
import {
  TrendingUp,
  TrendingDown,
  MapPin,
  ShieldAlert,
  Users,
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
import {
  useDashboardStats,
  useRecentUsers,
  useRecentLocations,
} from '@/features/dashboard/hooks/dashboard.hooks'

export const Route = createFileRoute('/_auth/')({
  component: DashboardPage,
})

function DashboardPage() {
  const { totalUsers, totalRoles, totalLocations, activeLocations, isLoading } =
    useDashboardStats()
  const { data: recentUsers, isLoading: isLoadingUsers } = useRecentUsers()
  const { data: recentLocations, isLoading: isLoadingLocations } =
    useRecentLocations()

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            System overview and quick access.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={isLoading ? '...' : totalUsers}
          description="Total registered users"
          icon={Users}
          trend="up"
        />
        <StatCard
          title="Total Roles"
          value={isLoading ? '...' : totalRoles}
          description="System defined roles"
          icon={ShieldAlert}
          trend="up"
        />
        <StatCard
          title="Total Locations"
          value={isLoading ? '...' : totalLocations}
          description="Total locations"
          icon={MapPin}
          trend="up"
        />
        <StatCard
          title="Active Locations"
          value={isLoading ? '...' : activeLocations}
          description="Currently active locations"
          icon={TrendingUp}
          trend="up"
        />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        <Card className="lg:col-span-4 shadow-sm border-none bg-card/40 backdrop-blur-sm">
          <CardHeader className="p-4 md:p-6 pb-2">
            <CardTitle className="text-lg">Recent Locations</CardTitle>
            <CardDescription>
              Latest added locations in the system.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm border-collapse">
                <thead className="bg-muted/10">
                  <tr className="transition-colors hover:bg-muted/10">
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                      Name
                    </th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                      Type
                    </th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground text-center">
                      Status
                    </th>
                    <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y border-t border-border/50">
                  {isLoadingLocations ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-4 text-center text-muted-foreground"
                      >
                        Loading...
                      </td>
                    </tr>
                  ) : recentLocations?.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-4 text-center text-muted-foreground"
                      >
                        No locations found
                      </td>
                    </tr>
                  ) : (
                    recentLocations?.map((location) => (
                      <tr
                        key={location.id}
                        className="transition-colors hover:bg-muted/50 border-border/50"
                      >
                        <td className="p-3 md:p-4 align-middle font-medium">
                          {location.name}
                        </td>
                        <td className="p-3 md:p-4 align-middle capitalize">
                          {location.type.replace('_', ' ')}
                        </td>
                        <td className="p-3 md:p-4 align-middle text-center">
                          <Badge
                            variant={
                              location.isActive ? 'outline' : 'secondary'
                            }
                          >
                            {location.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="p-3 md:p-4 align-middle text-right">
                          <Button variant="ghost" size="icon-xs">
                            <ArrowUpRight className="size-3" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 shadow-sm border-none bg-card/40 backdrop-blur-sm">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-lg">Recent Users</CardTitle>
            <CardDescription>Latest users registered.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="space-y-6">
              {isLoadingUsers ? (
                <p className="text-sm text-muted-foreground">
                  Loading users...
                </p>
              ) : recentUsers?.length === 0 ? (
                <p className="text-sm text-muted-foreground">No users found</p>
              ) : (
                recentUsers?.map((user) => (
                  <div key={user.id} className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-medium">
                        {user.fullname
                          ?.split(' ')
                          .map((n: string) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2) ||
                          user.username.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="text-sm font-medium leading-none truncate">
                        {user.fullname || user.username}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    <Badge
                      variant={user.isActive ? 'outline' : 'secondary'}
                      className="text-[10px] px-1.5 h-4"
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))
              )}
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
