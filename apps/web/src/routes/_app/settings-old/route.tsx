import { createFileRoute } from '@tanstack/react-router'
import {
  Page,
  PageContent,
  PageHeader,
  PageTitle,
  PageTitleContainer,
} from '@/components/layout/page-old'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  LucideIcon,
  MapPinIcon,
  ShieldEllipsisIcon,
  UsersIcon,
  BellIcon,
  SearchIcon,
  MoreHorizontalIcon,
  PlusIcon,
  PaletteIcon,
  MailIcon,
  MoonIcon,
  SunIcon,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'

export const Route = createFileRoute('/_app/settings-old')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <Page>
      <PageHeader>
        <PageTitleContainer>
          <PageTitle>Pengaturan</PageTitle>
          <p className="text-muted-foreground text-sm">
            Kelola preferensi, pengguna, dan konfigurasi sistem Anda.
          </p>
        </PageTitleContainer>
      </PageHeader>
      <PageContent className="space-y-8">
        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <TabsList className="bg-muted/50 p-1 w-full sm:w-auto">
              <TabsTrigger value="users" className="gap-2 flex-1 sm:flex-none">
                <UsersIcon className="h-4 w-4" />
                Pengguna & Role
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="gap-2 flex-1 sm:flex-none"
              >
                <BellIcon className="h-4 w-4" />
                Notifikasi
              </TabsTrigger>
              <TabsTrigger
                value="appearance"
                className="gap-2 flex-1 sm:flex-none"
              >
                <PaletteIcon className="h-4 w-4" />
                Tampilan
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-8 gap-2">
                <MailIcon className="h-4 w-4" />
                Invite
              </Button>
              <Button size="sm" className="h-8 gap-2">
                <PlusIcon className="h-4 w-4" />
                Tambah Baru
              </Button>
            </div>
          </div>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex flex-wrap gap-4">
              {MOCK_STATS.map((stat) => (
                <CardStat key={stat.title} {...stat} />
              ))}
            </div>
            <Card>
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-4 border-b">
                <div className="space-y-1">
                  <CardTitle>Daftar Pengguna</CardTitle>
                  <CardDescription>
                    Kelola akses dan role pengguna sistem.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-auto">
                    <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Cari pengguna..."
                      className="pl-9 w-full sm:w-[250px] h-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_USERS.map((user) => (
                      <TableRow key={user.email}>
                        <TableCell>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback>{user.initials}</AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">
                          {user.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.role === 'Admin' ? 'default' : 'secondary'
                            }
                            className="font-normal"
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full ${user.status === 'Active' ? 'bg-green-500' : 'bg-gray-300'}`}
                            />
                            <span className="text-sm text-muted-foreground">
                              {user.status}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                />
                              }
                            >
                              <MoreHorizontalIcon className="h-4 w-4" />
                              <span className="sr-only">Menu</span>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>Edit Profil</DropdownMenuItem>
                              <DropdownMenuItem>Ubah Role</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                Hapus Pengguna
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter className="flex items-center justify-between border-t py-4">
                <div className="text-xs text-muted-foreground">
                  Menampilkan <strong>5</strong> dari <strong>20</strong>{' '}
                  pengguna
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled>
                    Sebelumnya
                  </Button>
                  <Button variant="outline" size="sm">
                    Selanjutnya
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Preferensi Notifikasi</CardTitle>
                <CardDescription>
                  Pilih bagaimana Anda ingin menerima pembaruan sistem.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-4">
                  <div className="space-y-1">
                    <Label className="text-base">Email Notifikasi</Label>
                    <p className="text-sm text-muted-foreground">
                      Terima email tentang aktivitas akun Anda.
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between space-x-4">
                  <div className="space-y-1">
                    <Label className="text-base">Notifikasi Push</Label>
                    <p className="text-sm text-muted-foreground">
                      Terima notifikasi push realtime di perangkat ini.
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between space-x-4">
                  <div className="space-y-1">
                    <Label className="text-base">Laporan Mingguan</Label>
                    <p className="text-sm text-muted-foreground">
                      Terima ringkasan aktivitas mingguan setiap Senin.
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tampilan</CardTitle>
                <CardDescription>
                  Sesuaikan tampilan aplikasi dengan preferensi Anda.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="space-y-2">
                  <Label>Tema</Label>
                  <div className="grid grid-cols-3 gap-4 max-w-md">
                    <div className="border-2 border-primary rounded-md p-2 bg-background cursor-pointer hover:bg-accent/50 transition-colors">
                      <div className="space-y-2 rounded-sm bg-muted p-2">
                        <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
                          <div className="h-2 w-20 rounded bg-slate-300" />
                          <div className="h-2 w-[100px] rounded bg-slate-300" />
                        </div>
                        <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                          <div className="h-4 w-4 rounded-full bg-slate-300" />
                          <div className="h-2 w-[100px] rounded bg-slate-300" />
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-2 p-2 w-full text-sm font-normal">
                        <SunIcon className="h-4 w-4" /> Terang
                      </div>
                    </div>
                    <div className="border rounded-md p-2 bg-slate-950 cursor-pointer hover:border-primary transition-colors">
                      <div className="space-y-2 rounded-sm bg-slate-800 p-2">
                        <div className="space-y-2 rounded-md bg-slate-950 p-2 shadow-sm">
                          <div className="h-2 w-20 rounded bg-slate-600" />
                          <div className="h-2 w-[100px] rounded bg-slate-600" />
                        </div>
                        <div className="flex items-center space-x-2 rounded-md bg-slate-950 p-2 shadow-sm">
                          <div className="h-4 w-4 rounded-full bg-slate-600" />
                          <div className="h-2 w-[100px] rounded bg-slate-600" />
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-2 p-2 w-full text-sm font-normal text-white">
                        <MoonIcon className="h-4 w-4" /> Gelap
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </PageContent>
    </Page>
  )
}

const MOCK_STATS: CardStatProps[] = [
  {
    title: 'Total User',
    value: '20',
    icon: UsersIcon,
    description: '+2 bulan ini',
  },
  {
    title: 'Total Role',
    value: '6',
    icon: ShieldEllipsisIcon,
    description: 'Stabil',
  },
  {
    title: 'Total Lokasi',
    value: '2',
    icon: MapPinIcon,
    description: '1 lokasi utama',
  },
]

const MOCK_USERS = [
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'Admin',
    status: 'Active',
    initials: 'JD',
    avatar: '',
  },
  {
    name: 'Alice Smith',
    email: 'alice.smith@example.com',
    role: 'Manager',
    status: 'Active',
    initials: 'AS',
    avatar: '',
  },
  {
    name: 'Bob Wilson',
    email: 'bob.wilson@example.com',
    role: 'Staff',
    status: 'Inactive',
    initials: 'BW',
    avatar: '',
  },
  {
    name: 'Sarah Jones',
    email: 'sarah.j@example.com',
    role: 'Staff',
    status: 'Active',
    initials: 'SJ',
    avatar: '',
  },
  {
    name: 'Mike Brown',
    email: 'mike.b@example.com',
    role: 'Staff',
    status: 'Active',
    initials: 'MB',
    avatar: '',
  },
]

interface CardStatProps {
  title: string
  value: string
  icon: LucideIcon
  description?: string
}

function CardStat({ title, value, icon: Icon, description }: CardStatProps) {
  return (
    <div className="flex flex-1 items-center gap-4 p-2 rounded-xl border bg-card text-card-foreground shadow-sm min-w-[200px] hover:shadow-md transition-all">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold">{value}</p>
          {description && (
            <span className="text-xs text-muted-foreground">{description}</span>
          )}
        </div>
      </div>
    </div>
  )
}
