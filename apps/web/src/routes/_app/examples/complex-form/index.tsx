import {
  Page,
  PageActions,
  PageContent,
  PageDescription,
  PageHeader,
  PageTitle,
  PageTitleContainer,
} from '@/components/layout/page-old'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createFileRoute } from '@tanstack/react-router'
import { ChevronLeftIcon, PlusIcon, SaveIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/_app/examples/complex-form/')({
  component: ComplexFormPage,
})

type InvoiceItem = {
  id: string
  description: string
  quantity: number
  unitPrice: number
  tax: number
}

function ComplexFormPage() {
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: '1',
      description: 'Web Development Services',
      quantity: 1,
      unitPrice: 1500,
      tax: 0,
    },
  ])

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Math.random().toString(36).substr(2, 9),
        description: '',
        quantity: 1,
        unitPrice: 0,
        tax: 0,
      },
    ])
  }

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    )
  }

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  }

  const calculateTotal = () => {
    // simplified tax calc
    return calculateSubtotal() * 1.1 // Assuming flat 10% tax for total for now or we sum individual tax
  }

  return (
    <Page>
      <PageHeader sticky>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="-ml-2">
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <PageTitleContainer>
            <PageTitle>New Invoice</PageTitle>
            <PageDescription>
              Create a new invoice for a client.
            </PageDescription>
          </PageTitleContainer>
        </div>
        <PageActions>
          <Button variant="outline">Save Draft</Button>
          <Button>
            <SaveIcon className="mr-2 h-4 w-4" />
            Send Invoice
          </Button>
        </PageActions>
      </PageHeader>
      <PageContent>
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Client Details</CardTitle>
                <CardDescription>Bill to information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label>Client</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="acme">Acme Corp</SelectItem>
                      <SelectItem value="globex">Globex Inc</SelectItem>
                      <SelectItem value="soylent">Soylent Corp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input placeholder="client@example.com" />
                </div>
                <div className="grid gap-2">
                  <Label>Address</Label>
                  <Input placeholder="Street Address" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="City" />
                    <Input placeholder="Postal Code" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
                <CardDescription>Payment terms and dates.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Invoice Date</Label>
                    <Input type="date" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Due Date</Label>
                    <Input type="date" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Currency</Label>
                  <Select defaultValue="usd">
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">USD ($)</SelectItem>
                      <SelectItem value="eur">EUR (€)</SelectItem>
                      <SelectItem value="gbp">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Notes</Label>
                  <Input placeholder="Optional notes for the client..." />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Items</span>
                <Button size="sm" variant="outline" onClick={addItem}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Description</TableHead>
                    <TableHead className="w-[100px]">Quantity</TableHead>
                    <TableHead className="w-[150px]">Unit Price</TableHead>
                    <TableHead className="w-[150px] text-right">
                      Amount
                    </TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Input
                          value={item.description}
                          onChange={(e) =>
                            updateItem(item.id, 'description', e.target.value)
                          }
                          placeholder="Item description"
                          className="border-0 shadow-none focus-visible:ring-0 px-0 h-auto font-medium"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              'quantity',
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="h-8 w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                            $
                          </span>
                          <Input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                'unitPrice',
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="h-8 w-32 pl-6"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${(item.quantity * item.unitPrice).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {items.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <div className="p-6 bg-muted/20 border-t flex flex-col items-end gap-2">
              <div className="flex justify-between w-[300px] text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between w-[300px] text-sm">
                <span className="text-muted-foreground">Tax (10%)</span>
                <span>${(calculateSubtotal() * 0.1).toFixed(2)}</span>
              </div>
              <div className="flex justify-between w-[300px] text-lg font-bold mt-2">
                <span>Total</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </Card>
        </div>
      </PageContent>
    </Page>
  )
}
