import {
  Page,
  PageActions,
  PageContent,
  PageDescription,
  PageHeader,
  PageTitle,
  PageTitleContainer,
} from '@/components/layout/page'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useLocationStore } from '@/features/locations/hooks/use-location-store'
import { createFileRoute } from '@tanstack/react-router'
import { DollarSignIcon, PackageIcon, ShoppingCartIcon } from 'lucide-react'

export const Route = createFileRoute('/_app/')({
  component: Dashboard,
})

function Dashboard() {
  const { selectedLocationId, locations } = useLocationStore()
  const activeLocation = locations.find((l) => l.id === selectedLocationId)

  // Mock Data Logic based on location
  const sales = selectedLocationId ? 12345 : 45678
  const orders = selectedLocationId ? 24 : 156
  const inventory = selectedLocationId ? 50000 : 250000

  return (
    <Page>
      <PageHeader>
        <PageTitleContainer>
          <PageTitle>Dashboard</PageTitle>
          <PageDescription>
            Overview of your organization performance across locations.
          </PageDescription>
        </PageTitleContainer>
        <PageActions>
          <span className="text-sm text-muted-foreground">
            Viewing:{' '}
            <span className="font-semibold text-foreground">
              {activeLocation ? activeLocation.name : 'All Locations'}
            </span>
          </span>
        </PageActions>
      </PageHeader>
      <PageContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${sales.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                +20.1% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Orders
              </CardTitle>
              <ShoppingCartIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{orders}</div>
              <p className="text-xs text-muted-foreground">
                +180.1% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Inventory Val.
              </CardTitle>
              <PackageIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${inventory.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                +19% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Recent Sales</CardTitle>
              <CardDescription>
                {activeLocation
                  ? `Recent sales for ${activeLocation.name}`
                  : `Consolidated sales across all locations`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                No recent sales data available for mock.
              </p>
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Top Products</CardTitle>
              <CardDescription>Best selling items this month</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Product A - 500 units
              </p>
              <p className="text-sm text-muted-foreground">
                Product B - 300 units
              </p>
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </Page>
  )
}
