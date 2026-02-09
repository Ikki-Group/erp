import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Activity,
  AlertCircle,
  Bell,
  Calendar as CalendarIcon,
  Check,
  Loader2,
  Mail,
} from 'lucide-react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

import { toast } from 'sonner'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

export const Route = createFileRoute('/_auth/playground')({
  component: PlaygroundPage,
})

function PlaygroundPage() {
  const [date, setDate] = useState<Date>()

  return (
    <div className="container mx-auto py-10 space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Design System Playground
        </h1>
        <p className="text-muted-foreground">
          A showcase of all available components and primitives in our design
          system.
        </p>
      </div>

      <Tabs defaultValue="primitives" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-2 bg-transparent p-0">
          <TabsTrigger
            value="primitives"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Primitives
          </TabsTrigger>
          <TabsTrigger
            value="buttons"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Buttons & Inputs
          </TabsTrigger>
          <TabsTrigger
            value="data"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Data Display
          </TabsTrigger>
          <TabsTrigger
            value="overlays"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Overlays
          </TabsTrigger>
          <TabsTrigger
            value="feedback"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Feedback
          </TabsTrigger>
        </TabsList>

        <TabsContent value="primitives" className="space-y-8">
          <Section title="Typography">
            <div className="space-y-4">
              <div className="space-y-2">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
                  Heading 1
                </h1>
                <p className="text-muted-foreground">
                  text-4xl font-extrabold tracking-tight lg:text-5xl
                </p>
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-semibold tracking-tight first:mt-0">
                  Heading 2
                </h2>
                <p className="text-muted-foreground">
                  text-3xl font-semibold tracking-tight
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold tracking-tight">
                  Heading 3
                </h3>
                <p className="text-muted-foreground">
                  text-2xl font-semibold tracking-tight
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-semibold tracking-tight">
                  Heading 4
                </h4>
                <p className="text-muted-foreground">
                  text-xl font-semibold tracking-tight
                </p>
              </div>
              <div className="space-y-2">
                <p className="leading-7 [&:not(:first-child)]:mt-6">
                  The king, seeing how much happier his subjects were, realized
                  the error of his ways and repealed the joke tax.
                </p>
                <p className="text-muted-foreground">p leading-7</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium leading-none">Small text</p>
                <p className="text-muted-foreground">
                  text-sm font-medium leading-none
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Muted text</p>
                <p className="text-muted-foreground">
                  text-sm text-muted-foreground
                </p>
              </div>
            </div>
          </Section>

          <Section title="Colors - Primary">
            <div className="flex flex-wrap gap-4">
              <ColorCard
                name="bg-primary"
                className="bg-primary text-primary-foreground"
              />
              <ColorCard
                name="bg-primary/90"
                className="bg-primary/90 text-primary-foreground"
              />
              <ColorCard
                name="bg-primary/80"
                className="bg-primary/80 text-primary-foreground"
              />
              <ColorCard
                name="bg-primary/50"
                className="bg-primary/50 text-white"
              />
            </div>
          </Section>

          <Section title="Colors - Secondary">
            <div className="flex flex-wrap gap-4">
              <ColorCard
                name="bg-secondary"
                className="bg-secondary text-secondary-foreground"
              />
              <ColorCard
                name="bg-secondary/80"
                className="bg-secondary/80 text-secondary-foreground"
              />
            </div>
          </Section>

          <Section title="Colors - Destructive">
            <div className="flex flex-wrap gap-4">
              <ColorCard
                name="bg-destructive"
                className="bg-destructive text-destructive-foreground"
              />
              <ColorCard
                name="bg-destructive/90"
                className="bg-destructive/90 text-destructive-foreground"
              />
            </div>
          </Section>

          <Section title="Colors - Muted">
            <div className="flex flex-wrap gap-4">
              <ColorCard
                name="bg-muted"
                className="bg-muted text-muted-foreground"
              />
              <ColorCard
                name="bg-muted/50"
                className="bg-muted/50 text-muted-foreground"
              />
            </div>
          </Section>

          <Section title="Colors - Accent">
            <div className="flex flex-wrap gap-4">
              <ColorCard
                name="bg-accent"
                className="bg-accent text-accent-foreground"
              />
            </div>
          </Section>

          <Section title="Colors - Card & Popover">
            <div className="flex flex-wrap gap-4">
              <ColorCard
                name="bg-card"
                className="bg-card text-card-foreground border"
              />
              <ColorCard
                name="bg-popover"
                className="bg-popover text-popover-foreground border"
              />
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="buttons" className="space-y-8">
          <Section title="Buttons">
            <div className="flex flex-wrap gap-4 items-center">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </div>
            <div className="flex flex-wrap gap-4 items-center mt-4">
              <Button size="icon-lg">
                <Mail className="size-5" />
              </Button>
              <Button size="icon">
                <Mail className="size-4" />
              </Button>
              <Button size="icon-sm">
                <Mail className="size-4" />
              </Button>
              <Button size="icon-xs">
                <Mail className="size-3" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-4 items-center mt-4">
              <Button size="lg">Large</Button>
              <Button>Default</Button>
              <Button size="sm">Small</Button>
              <Button size="xs">Extra Small</Button>
            </div>
            <div className="flex flex-wrap gap-4 items-center mt-4">
              <Button disabled>Disabled</Button>
              <Button>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait
              </Button>
              <Button>
                <Mail className="mr-2 h-4 w-4" /> Login with Email
              </Button>
            </div>
          </Section>

          <Section title="Inputs">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input type="email" id="email" placeholder="Email" />
            </div>
            <div className="grid w-full max-w-sm items-center gap-1.5 mt-4">
              <Label htmlFor="file">File</Label>
              <Input id="file" type="file" />
            </div>
            <div className="grid w-full max-w-sm items-center gap-1.5 mt-4">
              <Label htmlFor="disabled">Disabled</Label>
              <Input disabled id="disabled" placeholder="Disabled" />
            </div>
          </Section>

          <Section title="Textarea">
            <div className="grid w-full gap-1.5">
              <Label htmlFor="message">Your message</Label>
              <Textarea placeholder="Type your message here." id="message" />
            </div>
          </Section>

          <Section title="Select">
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </Section>

          <Section title="Checkbox">
            <div className="flex items-center space-x-2">
              <Checkbox id="terms" />
              <Label htmlFor="terms">Accept terms and conditions</Label>
            </div>
          </Section>

          <Section title="Radio Group">
            <RadioGroup defaultValue="comfortable">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="default" id="r1" />
                <Label htmlFor="r1">Default</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="comfortable" id="r2" />
                <Label htmlFor="r2">Comfortable</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="compact" id="r3" />
                <Label htmlFor="r3">Compact</Label>
              </div>
            </RadioGroup>
          </Section>

          <Section title="Switch">
            <div className="flex items-center space-x-2">
              <Switch id="airplane-mode" />
              <Label htmlFor="airplane-mode">Airplane Mode</Label>
            </div>
          </Section>

          <Section title="Slider">
            <Slider
              defaultValue={[50]}
              max={100}
              step={1}
              className="w-[60%]"
            />
          </Section>
          <Section title="Date Picker">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={cn(
                    'w-[280px] justify-start text-left font-normal',
                    !date && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </Section>
        </TabsContent>

        <TabsContent value="data" className="space-y-8">
          <Section title="Cards">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Card Title</CardTitle>
                  <CardDescription>Card Description</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Card Content</p>
                </CardContent>
                <CardFooter>
                  <p>Card Footer</p>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>You have 3 unread messages.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className=" flex items-center space-x-4 rounded-md border p-4">
                    <Bell className="size-5" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Push Notifications
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Send notifications to device.
                      </p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">
                    <Check className="mr-2 h-4 w-4" /> Mark all as read
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </Section>

          <Section title="Badges">
            <div className="flex gap-4">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </div>
          </Section>

          <Section title="Avatars">
            <div className="flex gap-4">
              <Avatar>
                <AvatarImage
                  src="https://github.com/shadcn.png"
                  alt="@shadcn"
                />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarImage src="https://github.com/wrong.png" alt="@shadcn" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
            </div>
          </Section>

          <Section title="Table">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Invoice</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">INV001</TableCell>
                    <TableCell>Paid</TableCell>
                    <TableCell>Credit Card</TableCell>
                    <TableCell className="text-right">$250.00</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">INV002</TableCell>
                    <TableCell>Pending</TableCell>
                    <TableCell>PayPal</TableCell>
                    <TableCell className="text-right">$150.00</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="overlays" className="space-y-8">
          <Section title="Dialog">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Open Dialog</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit profile</DialogTitle>
                  <DialogDescription>
                    Make changes to your profile here. Click save when you're
                    done.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      defaultValue="Pedro Duarte"
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="username" className="text-right">
                      Username
                    </Label>
                    <Input
                      id="username"
                      defaultValue="@peduarte"
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Save changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Section>

          <Section title="Sheet">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Open Sheet</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Edit profile</SheetTitle>
                  <SheetDescription>
                    Make changes to your profile here. Click save when you're
                    done.
                  </SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      defaultValue="Pedro Duarte"
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="username" className="text-right">
                      Username
                    </Label>
                    <Input
                      id="username"
                      defaultValue="@peduarte"
                      className="col-span-3"
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button type="submit">Save changes</Button>
                </div>
              </SheetContent>
            </Sheet>
          </Section>

          <Section title="Tooltip">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">Hover</Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add to library</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Section>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-8">
          <Section title="Alert">
            <div className="space-y-4">
              <Alert>
                <Activity className="h-4 w-4" />
                <AlertTitle>Heads up!</AlertTitle>
                <AlertDescription>
                  You can add components to your app using the cli.
                </AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Your session has expired. Please log in again.
                </AlertDescription>
              </Alert>
            </div>
          </Section>

          <Section title="Toast">
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() =>
                  toast('Event has been created', {
                    description: 'Sunday, December 03, 2023 at 9:00 AM',
                    action: {
                      label: 'Undo',
                      onClick: () => console.log('Undo'),
                    },
                  })
                }
              >
                Show Toast
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  toast.error('Uh oh! Something went wrong.', {
                    description: 'There was a problem with your request.',
                  })
                }
              >
                Show Error Toast
              </Button>
            </div>
          </Section>

          <Section title="Progress">
            <Progress value={33} className="w-[60%]" />
          </Section>
        </TabsContent>

        <TabsContent value="navigation" className="space-y-8">
          <Section title="Breadcrumb">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/components">Components</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </Section>

          <Section title="Pagination">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">1</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" isActive>
                    2
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">3</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href="#" />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </Section>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
        <Separator className="flex-1" />
      </div>
      <div className="p-4 md:p-6 border rounded-lg bg-card/50 backdrop-blur-sm">
        {children}
      </div>
    </div>
  )
}

function ColorCard({ name, className }: { name: string; className: string }) {
  return (
    <div
      className={cn(
        'h-24 w-48 rounded-md flex items-center justify-center border shadow-sm',
        className,
      )}
    >
      <span className="font-mono text-sm font-medium">{name}</span>
    </div>
  )
}
