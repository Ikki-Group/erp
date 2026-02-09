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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createFileRoute } from '@tanstack/react-router'
import { ChevronLeftIcon, SaveIcon } from 'lucide-react'

export const Route = createFileRoute('/_app/examples/form/')({
  component: FormPage,
})

function FormPage() {
  return (
    <Page>
      <PageHeader sticky>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="-ml-2">
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <PageTitleContainer>
            <PageTitle>Create Product</PageTitle>
            <PageDescription>
              Add a new product to your inventory.
            </PageDescription>
          </PageTitleContainer>
        </div>
        <PageActions>
          <Button variant="outline">Cancel</Button>
          <Button>
            <SaveIcon className="mr-2 h-4 w-4" />
            Save Product
          </Button>
        </PageActions>
      </PageHeader>
      <PageContent>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>General Information</CardTitle>
                <CardDescription>
                  Product details and identification.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label>Product Name</Label>
                  <Input placeholder="e.g. Wireless Headphones" />
                </div>

                <div className="grid gap-2">
                  <Label>Description</Label>
                  <Textarea placeholder="Product description..." />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Base Price</Label>
                  <Input type="number" placeholder="0.00" />
                </div>
                <div className="grid gap-2">
                  <Label>Sale Price</Label>
                  <Input type="number" placeholder="0.00" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Status select placeholder */}
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <select className="bg-background w-full rounded-md border p-2">
                    <option>Draft</option>
                    <option>Active</option>
                    <option>Archived</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Organization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <select className="bg-background w-full rounded-md border p-2">
                    <option>Select category...</option>
                    <option>Electronics</option>
                    <option>Clothing</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContent>
    </Page>
  )
}
