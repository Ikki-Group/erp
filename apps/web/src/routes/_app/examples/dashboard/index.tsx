import {
  Page,
  PageActions,
  PageContent,
  PageDescription,
  PageHeader,
  PageTitle,
  PageTitleContainer,
} from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createFileRoute } from '@tanstack/react-router'
import {
  ActivityIcon,
  CreditCardIcon,
  DollarSignIcon,
  UsersIcon,
} from 'lucide-react'

export const Route = createFileRoute('/_app/examples/dashboard/')({
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <Page>
      <PageHeader>
        <PageTitleContainer>
          <PageTitle>Analytics Dashboard</PageTitle>
          <PageDescription>
            Real-time overview of your business performance.
          </PageDescription>
        </PageTitleContainer>
        <PageActions>
          <Button>Download Report</Button>
        </PageActions>
      </PageHeader>
      <PageContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Revenue
                  </CardTitle>
                  <DollarSignIcon className="text-muted-foreground h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$45,231.89</div>
                  <p className="text-muted-foreground text-xs">
                    +20.1% from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Subscriptions
                  </CardTitle>
                  <UsersIcon className="text-muted-foreground h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+2350</div>
                  <p className="text-muted-foreground text-xs">
                    +180.1% from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sales</CardTitle>
                  <CreditCardIcon className="text-muted-foreground h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+12,234</div>
                  <p className="text-muted-foreground text-xs">
                    +19% from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Now
                  </CardTitle>
                  <ActivityIcon className="text-muted-foreground h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+573</div>
                  <p className="text-muted-foreground text-xs">
                    +201 since last hour
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Overview</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  {/* Chart placeholder */}
                  <div className="bg-muted/20 text-muted-foreground flex h-[240px] w-full items-center justify-center rounded">
                    Chart Area
                  </div>
                </CardContent>
              </Card>
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    You made 265 sales this month.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    <div className="flex items-center">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          Olivia Martin
                        </p>
                        <p className="text-muted-foreground text-sm">
                          olivia.martin@email.com
                        </p>
                      </div>
                      <div className="ml-auto font-medium">+$1,999.00</div>
                    </div>
                    <div className="flex items-center">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          Jackson Lee
                        </p>
                        <p className="text-muted-foreground text-sm">
                          jackson.lee@email.com
                        </p>
                      </div>
                      <div className="ml-auto font-medium">+$39.00</div>
                    </div>
                    <div className="flex items-center">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          Isabella Nguyen
                        </p>
                        <p className="text-muted-foreground text-sm">
                          isabella.nguyen@email.com
                        </p>
                      </div>
                      <div className="ml-auto font-medium">+$299.00</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>
                    Invite your team members to collaborate.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Mock content */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">
                            Sofia Davis
                          </p>
                          <p className="text-muted-foreground text-sm">
                            m@example.com
                          </p>
                        </div>
                      </div>
                      <select className="rounded border p-1 text-sm bg-background">
                        <option>Owner</option>
                        <option>Member</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">
                            Jackson Lee
                          </p>
                          <p className="text-muted-foreground text-sm">
                            p@example.com
                          </p>
                        </div>
                      </div>
                      <select className="rounded border p-1 text-sm bg-background">
                        <option>Member</option>
                        <option>Admin</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="col-span-1 md:col-span-1 lg:col-span-2">
                <CardHeader>
                  <CardTitle>Server Stats</CardTitle>
                  <CardDescription>System performance metrics.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="text-primary text-2xl font-bold">
                        99.9%
                      </div>
                      <div className="text-muted-foreground mt-1 text-xs font-bold uppercase">
                        Uptime
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="text-primary text-2xl font-bold">
                        24ms
                      </div>
                      <div className="text-muted-foreground mt-1 text-xs font-bold uppercase">
                        Latency
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="text-primary text-2xl font-bold">
                        1.2GB
                      </div>
                      <div className="text-muted-foreground mt-1 text-xs font-bold uppercase">
                        Bandwidth
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </PageContent>
    </Page>
  )
}
