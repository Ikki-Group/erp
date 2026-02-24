import { CardStat, CardStatProps } from '@/components/card/card-stat'
import { Page } from '@/components/layout/page'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table } from '@/components/ui/table'
import { Tabs } from '@/components/ui/tabs'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  MapPinIcon,
  MoreHorizontalIcon,
  PlusIcon,
  ShieldEllipsisIcon,
  UsersIcon,
} from 'lucide-react'

import { settingsApi } from '@/features/dashboard/api/settings.api'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { roleApi } from '@/features/iam'
import {
  DataTable,
  useDataTable,
  useDataTableState,
} from '@/components/data-table'
import { createColumnHelper } from '@tanstack/react-table'
import { RoleDto } from '@/features/iam/dto'

export const Route = createFileRoute('/_app/settings-new/')({
  component: RouteComponent,
})

const TABS = [
  ['Pengguna', 'users'],
  ['Role', 'roles'],
  ['Lokasi', 'locations'],
]

function RouteComponent() {
  return (
    <Page>
      <Page.SimpleHeader
        title="Pengaturan"
        description="Kelola preferensi, pengguna, dan konfigurasi sistem Anda."
      />
      <SettingsSummarySection />
      <Page.Content>
        <Tabs defaultValue="roles">
          <Tabs.List className="w-full md:w-min h-10!">
            {TABS.map(([title, value]) => (
              <Tabs.Trigger key={value} className="py-2 px-4" value={value}>
                {title}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <Card className="py-0 gap-0 mt-2 shadow-none">
            <Tabs.Content value="users">
              <UserCard />
            </Tabs.Content>
            <Tabs.Content value="roles">
              <RoleCard />
            </Tabs.Content>
            <Tabs.Content value="locations">
              <LocationCard />
            </Tabs.Content>
          </Card>
        </Tabs>
      </Page.Content>
    </Page>
  )
}

function SettingsSummarySection() {
  const { data } = useSuspenseQuery(settingsApi.summary.query({}))

  const stats = [
    {
      title: 'Total User',
      value: data.data.users,
      icon: UsersIcon,
    },
    {
      title: 'Total Role',
      value: data.data.roles,
      icon: ShieldEllipsisIcon,
    },
    {
      title: 'Total Lokasi',
      value: data.data.locations,
      icon: MapPinIcon,
    },
  ] satisfies CardStatProps[]

  return (
    <Page.Content className="flex flex-wrap gap-4">
      {stats.map((stat) => (
        <CardStat key={stat.title} {...stat} />
      ))}
    </Page.Content>
  )
}

interface User {
  id: string
  name: string
  email: string
  role: string
}

const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'Admin',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    role: 'User',
  },
]

function UserCard() {
  return (
    <>
      <Card.Header className="border-b pt-4">
        <Card.Title>Data Pengguna</Card.Title>
        <Card.Description>Kelola data pengguna sistem.</Card.Description>
        <Card.Action>
          <Button render={<Link to="/settings-new/users/create" />}>
            <PlusIcon />
            Tambah Pengguna
          </Button>
        </Card.Action>
      </Card.Header>
      <Card.Content className="px-2">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.Head>Nama</Table.Head>
              <Table.Head>Email</Table.Head>
              <Table.Head>Role</Table.Head>
              <Table.Head>Status</Table.Head>
              <Table.Head className="text-right">Aksi</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {MOCK_USERS.map((user) => (
              <Table.Row key={user.id}>
                <Table.Cell>{user.name}</Table.Cell>
                <Table.Cell>{user.email}</Table.Cell>
                <Table.Cell>{user.role}</Table.Cell>
                <Table.Cell>
                  <Badge
                    variant={user.role === 'Admin' ? 'default' : 'secondary'}
                    className="font-normal"
                  >
                    {user.role}
                  </Badge>
                </Table.Cell>
                <Table.Cell className="text-right">
                  <Button variant="ghost" size="icon">
                    <MoreHorizontalIcon />
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Card.Content>
      <Card.Footer>
        <Button variant="outline">Lihat Semua</Button>
      </Card.Footer>
    </>
  )
}

interface Role {
  id: string
  name: string
  description: string
}

const MOCK_ROLES: Role[] = [
  {
    id: '1',
    name: 'Admin',
    description: 'Administrator sistem',
  },
  {
    id: '2',
    name: 'User',
    description: 'Pengguna sistem',
  },
]

function RoleCard() {
  const ds = useDataTableState()
  const { data, isLoading } = useQuery(
    roleApi.list.query({
      ...ds.pagination,
    }),
  )

  const table = useDataTable({
    data: data?.data ?? [],
    rowCount: data?.meta.total ?? 0,
    pageCount: data?.meta.totalPages ?? 0,
    columns: roleColumns,
    ds,
    isLoading,
  })

  return (
    <DataTable table={table}>
      <Card.Header className="pt-4">
        <Card.Title>Data Role</Card.Title>
        <Card.Description>Kelola data role sistem.</Card.Description>
        <Card.Action>
          <Button>
            <PlusIcon />
            Tambah Role
          </Button>
        </Card.Action>
      </Card.Header>
      <DataTable.Table />
      <Card.Footer>
        <DataTable.Pagination />
      </Card.Footer>
    </DataTable>
  )
}

const roleCh = createColumnHelper<RoleDto>()
const roleColumns = [
  roleCh.accessor('name', {
    header: 'Nama',
    cell: (info) => info.getValue(),
  }),
]

interface Location {
  id: string
  name: string
  address: string
}

const MOCK_LOCATIONS: Location[] = [
  { id: '1', name: 'Jakarta', address: 'Jl. Sudirman No. 1' },
  { id: '2', name: 'Bandung', address: 'Jl. Asia Afrika No. 2' },
]

function LocationCard() {
  return (
    <>
      <Card.Header className="border-b pt-4">
        <Card.Title>Data Lokasi</Card.Title>
        <Card.Description>Kelola data lokasi sistem.</Card.Description>
        <Card.Action>
          <Button>
            <PlusIcon />
            Tambah Lokasi
          </Button>
        </Card.Action>
      </Card.Header>
      <Card.Content className="px-2">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.Head>Nama</Table.Head>
              <Table.Head>Alamat</Table.Head>
              <Table.Head className="text-right">Aksi</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {MOCK_LOCATIONS.map((location) => (
              <Table.Row key={location.id}>
                <Table.Cell>{location.name}</Table.Cell>
                <Table.Cell>{location.address}</Table.Cell>
                <Table.Cell className="text-right">
                  <Button variant="ghost" size="icon">
                    <MoreHorizontalIcon />
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Card.Content>
      <Card.Footer>
        <Button variant="outline">Lihat Semua</Button>
      </Card.Footer>
    </>
  )
}
