import {
  Page,
  PageActions,
  PageContent,
  PageDescription,
  PageHeader,
  PageTitle,
  PageTitleContainer,
} from '@/components/layout/page-old'
import { DataTable } from '@/components/common/templates/DataTable'
import { Button } from '@/components/ui/button'
import { createFileRoute } from '@tanstack/react-router'
import { ColumnDef } from '@tanstack/react-table'
import { PlusIcon, FileDownIcon, FileUpIcon } from 'lucide-react'

// Define the Payment type
type Payment = {
  id: string
  amount: number
  status: 'pending' | 'processing' | 'success' | 'failed'
  email: string
  date: string
}

const data: Payment[] = [
  {
    id: 'm5gr84i9',
    amount: 316,
    status: 'success',
    email: 'ken99@yahoo.com',
    date: '2024-01-01',
  },
  {
    id: '3u1reoj4',
    amount: 242,
    status: 'success',
    email: 'Abe45@gmail.com',
    date: '2024-01-02',
  },
  {
    id: 'derv1ws0',
    amount: 837,
    status: 'processing',
    email: 'Monserrat44@gmail.com',
    date: '2024-01-03',
  },
  {
    id: '5kma53ae',
    amount: 874,
    status: 'success',
    email: 'Silas22@gmail.com',
    date: '2024-01-04',
  },
  {
    id: 'bhqecj4p',
    amount: 721,
    status: 'failed',
    email: 'carmella@hotmail.com',
    date: '2024-01-05',
  },
  {
    id: 'gen7452d',
    amount: 123,
    status: 'pending',
    email: 'john.doe@example.com',
    date: '2024-01-06',
  },
]

const columns: ColumnDef<Payment>[] = [
  {
    accessorKey: 'id',
    header: 'Transaction ID',
    cell: ({ row }) => <div className="font-mono">{row.getValue('id')}</div>,
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      return <div className="capitalize">{status}</div>
    },
  },
  {
    accessorKey: 'amount',
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('amount'))
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount)

      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: 'date',
    header: 'Date',
  },
]

export const Route = createFileRoute('/_app/examples/table/')({
  component: TablePage,
})

function TablePage() {
  return (
    <Page>
      <PageHeader sticky>
        <PageTitleContainer>
          <PageTitle>Transactions</PageTitle>
          <PageDescription>
            Manage and view all your transactions in one place.
          </PageDescription>
        </PageTitleContainer>
        <PageActions>
          <Button variant="outline" size="sm">
            <FileUpIcon className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <FileDownIcon className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button size="sm">
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </PageActions>
      </PageHeader>
      <PageContent>
        <DataTable
          columns={columns}
          data={data}
          searchKey="email"
          searchPlaceholder="Filter emails..."
        />
      </PageContent>
    </Page>
  )
}
