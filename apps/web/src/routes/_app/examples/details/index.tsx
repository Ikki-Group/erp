import { createFileRoute } from '@tanstack/react-router'
import {
  CalendarIcon,
  CreditCardIcon,
  MailIcon,
  MapPinIcon,
} from 'lucide-react'
import type {
  DescriptionItem} from '@/components/common/data-display/description-list';
import { Page } from '@/components/layout/page'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DescriptionList
} from '@/components/common/data-display/description-list'
import { Grid } from '@/components/common/layout/primitives'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export const Route = createFileRoute('/_app/examples/details/')({
  component: DetailsPage,
})

function DetailsPage() {
  const accountInfo: Array<DescriptionItem> = [
    {
      term: 'Full Name',
      description: 'Isabella Nguyen',
    },
    {
      term: 'Email Address',
      description: (
        <a
          href="mailto:isabella@example.com"
          className="hover:underline flex items-center gap-1"
        >
          <MailIcon className="h-4 w-4 text-muted-foreground" />
          isabella@example.com
        </a>
      ),
    },
    {
      term: 'Role',
      description: <Badge>Administrator</Badge>,
    },
    {
      term: 'Location',
      description: (
        <div className="flex items-center gap-1 text-muted-foreground">
          <MapPinIcon className="h-4 w-4" />
          <span>San Francisco, CA</span>
        </div>
      ),
    },
    {
      term: 'Bio',
      description:
        'Senior Software Engineer with 10+ years of experience in building scalable web applications. Passionate about UX and performance.',
      className: 'md:col-span-2',
    },
  ]

  const orderDetails: Array<DescriptionItem> = [
    {
      term: 'Order ID',
      description: (
        <code className="bg-muted px-1.5 py-0.5 rounded text-sm">
          #ORD-2024-8521
        </code>
      ),
    },
    {
      term: 'Status',
      description: (
        <Badge
          variant="outline"
          className="border-green-500 text-green-700 bg-green-50"
        >
          Paid
        </Badge>
      ),
    },
    {
      term: 'Customer',
      description: (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src="/avatars/01.png" alt="@shadcn" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <span>John Doe</span>
        </div>
      ),
    },
    {
      term: 'Date',
      description: (
        <div className="flex items-center gap-1">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <span>Jan 24, 2024</span>
        </div>
      ),
    },
    {
      term: 'Payment Method',
      description: (
        <div className="flex items-center gap-2">
          <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
          <span>Visa ending under 4242</span>
        </div>
      ),
    },
    {
      term: 'Total',
      description: <span className="font-bold text-lg">$250.00</span>,
    },
  ]

  const documentList: Array<DescriptionItem> = [
    {
      term: 'Contract.pdf',
      description: (
        <div className="flex justify-between items-center w-full">
          <span className="text-muted-foreground">2.4 MB</span>
          <Button variant="ghost" size="sm">
            Download
          </Button>
        </div>
      ),
    },
    {
      term: 'Invoice_Jan.pdf',
      description: (
        <div className="flex justify-between items-center w-full">
          <span className="text-muted-foreground">1.1 MB</span>
          <Button variant="ghost" size="sm">
            Download
          </Button>
        </div>
      ),
    },
    {
      term: 'Specs_v2.docx',
      description: (
        <div className="flex justify-between items-center w-full">
          <span className="text-muted-foreground">4.5 MB</span>
          <Button variant="ghost" size="sm">
            Download
          </Button>
        </div>
      ),
    },
  ]

  return (
    <Page>
      <Page.BlockHeader
        title="Details Display"
        description="Examples of displaying key-value pairs with rich content."
      />

      <Page.Content>
        <Grid>
          {/* Card 1: User Profile (Grid layout) */}
          <Card>
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
              <CardDescription>
                Personal information and role details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DescriptionList
                items={accountInfo}
                columns={1}
                className="sm:grid-cols-2 gap-x-12"
              />
            </CardContent>
          </Card>

          {/* Card 2: Order Summary (Bordered List) */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>
                Details of the recent transaction.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DescriptionList
                items={orderDetails}
                variant="bordered"
                className="divide-border"
              />
            </CardContent>
          </Card>

          {/* Card 3: Document Attachments (Striped List) */}
          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
              <CardDescription>
                Documents related to this project.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DescriptionList items={documentList} variant="striped" />
            </CardContent>
          </Card>

          {/* Card 4: System Config (Vertical Layout with custom components) */}
          <Card>
            <CardHeader>
              <CardTitle>System Properties</CardTitle>
              <CardDescription>
                Advanced configuration settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DescriptionList
                layout="vertical"
                items={[
                  {
                    term: 'API Endpoint',
                    description: (
                      <code className="bg-muted p-1 rounded block w-full whitespace-pre-wrap break-all">
                        https://api.example.com/v1/users/webhook
                      </code>
                    ),
                  },
                  {
                    term: 'Public Key',
                    description: (
                      <div className="flex items-center gap-2">
                        <code className="bg-muted p-1 rounded text-xs flex-1 truncate">
                          pk_live_51Msz...234
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 text-xs"
                        >
                          Copy
                        </Button>
                      </div>
                    ),
                  },
                ]}
              />
            </CardContent>
          </Card>
        </Grid>
      </Page.Content>
    </Page>
  )
}
