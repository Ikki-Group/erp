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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { createFileRoute } from '@tanstack/react-router'
import { Edit2Icon, Trash2Icon, PrinterIcon } from 'lucide-react'

export const Route = createFileRoute('/_app/examples/detail/')({
  component: DetailPage,
})

function DetailPage() {
  return (
    <Page>
      <PageHeader>
        <PageTitleContainer>
          <div className="flex items-center gap-3">
            <PageTitle>Order #ORD-2024-001</PageTitle>
            <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
              Paid
            </span>
          </div>
          <PageDescription>Placed on January 23, 2024</PageDescription>
        </PageTitleContainer>
        <PageActions>
          <Button variant="outline" size="sm">
            <PrinterIcon className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Edit2Icon className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" size="sm">
            <Trash2Icon className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </PageActions>
      </PageHeader>
      <PageContent>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground">
                      Customer
                    </h4>
                    <p>Sofia Davis</p>
                    <p className="text-sm text-muted-foreground">
                      sofia@example.com
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground">
                      Phone
                    </h4>
                    <p>+1 202-555-0136</p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground">
                      Shipping Address
                    </h4>
                    <p>1234 Main St.</p>
                    <p>Anytown, CA 12345</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground">
                      Billing Address
                    </h4>
                    <p>Same as shipping</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                      <tr className="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors">
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Product
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Quantity
                        </th>
                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      <tr className="hover:bg-muted/50 border-b transition-colors">
                        <td className="p-4 align-middle font-medium">
                          Glimmer Lamps
                        </td>
                        <td className="p-4 align-middle">2</td>
                        <td className="p-4 text-right align-middle">$250.00</td>
                      </tr>
                      <tr className="hover:bg-muted/50 border-b transition-colors">
                        <td className="p-4 align-middle font-medium">
                          Aqua Filters
                        </td>
                        <td className="p-4 align-middle">1</td>
                        <td className="p-4 text-right align-middle">$49.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span>Total</span>
                  <span className="text-lg font-bold">$299.00</span>
                </div>
                <Separator className="my-4" />
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <span>Paid with Visa ending in 4242</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>History</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  <li className="border-muted relative border-l-2 pb-4 pl-6 last:pb-0">
                    <div className="bg-primary absolute -left-[5px] top-0 h-2 w-2 rounded-full" />
                    <p className="text-sm font-medium">Order Placed</p>
                    <p className="text-xs text-muted-foreground">
                      Jan 23, 2024 - 10:00 AM
                    </p>
                  </li>
                  <li className="border-muted relative border-l-2 pb-4 pl-6 last:pb-0">
                    <div className="bg-muted-foreground absolute -left-[5px] top-0 h-2 w-2 rounded-full" />
                    <p className="text-sm font-medium">Payment Confirmed</p>
                    <p className="text-xs text-muted-foreground">
                      Jan 23, 2024 - 10:05 AM
                    </p>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContent>
    </Page>
  )
}
