import { CardStat, CardStatProps } from '@/components/card/card-stat'
import { Page } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { Tabs } from '@/components/ui/tabs'
import { createFileRoute } from '@tanstack/react-router'
import { MapPinIcon, ShieldEllipsisIcon, UsersIcon } from 'lucide-react'

import { settingsApi } from '@/features/dashboard/api/settings.api'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { roleApi, userApi } from '@/features/iam'
import { createColumnHelper } from '@tanstack/react-table'
import { RoleDto, UserDto } from '@/features/iam/dto'
import { DataGridColumnHeader } from '@/components/reui/data-grid/data-grid-column-header'
import { useDataTableState } from '@/hooks/use-data-table-state'
import { useDataTable } from '@/hooks/use-data-table'
import { toDateTimeStamp } from '@/lib/formatter'
import { locationApi, LocationDto } from '@/features/location'
import { DataTableCard } from '@/components/card/data-table-card'

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
        <Tabs>
          <Tabs.List className="w-full md:w-min h-10!">
            {TABS.map(([title, value]) => (
              <Tabs.Trigger key={value} className="py-2 px-4" value={value}>
                {title}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <div className="mt-2">
            <Tabs.Content value="users">
              <UserTable />
            </Tabs.Content>
            <Tabs.Content value="roles">
              <RolesTable />
            </Tabs.Content>
            <Tabs.Content value="locations">
              <LocationsTable />
            </Tabs.Content>
          </div>
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

const userCh = createColumnHelper<UserDto>()
const userColumns = [
  userCh.accessor('username', {
    header: ({ column }) => (
      <DataGridColumnHeader
        title="Nama Role"
        visibility={true}
        column={column}
      />
    ),
    cell: (info) => (
      <div className="flex gap-1 flex-col">
        <p>{info.row.original.fullname}</p>
        <p className="text-muted-foreground text-xs italic">
          ({info.row.original.username})
        </p>
      </div>
    ),
    enableSorting: false,
    size: 200,
  }),
  userCh.accessor('createdAt', {
    header: 'Dibuat Pada',
    cell: (info) => (
      <p className="text-nowrap">
        {toDateTimeStamp(info.row.original.createdAt)}
      </p>
    ),
    enableSorting: false,
  }),
  userCh.accessor('updatedAt', {
    header: 'Diubah Pada',
    cell: (info) => (
      <p className="text-nowrap">
        {toDateTimeStamp(info.row.original.createdAt)}
      </p>
    ),
    enableSorting: false,
  }),
]

function UserTable() {
  const ds = useDataTableState()
  const { data, isLoading } = useQuery(
    userApi.list.query({
      ...ds.pagination,
    }),
  )

  const table = useDataTable({
    columns: userColumns,
    data: data?.data ?? [],
    pageCount: data?.meta.totalPages ?? 0,
    rowCount: data?.meta.total ?? 0,
    ds,
  })

  return (
    <DataTableCard
      table={table}
      isLoading={isLoading}
      recordCount={data?.meta.total || 0}
      action={<Button size="sm">Tambah Pengguna</Button>}
    />
  )
}

const roleCh = createColumnHelper<RoleDto>()
const roleColumns = [
  roleCh.accessor('name', {
    header: ({ column }) => (
      <DataGridColumnHeader
        title="Nama Role"
        visibility={true}
        column={column}
      />
    ),
    cell: (info) => (
      <div className="flex gap-2 flex-col">
        <p>{info.row.original.name}</p>
        <p className="text-muted-foreground text-xs italic">
          ({info.row.original.code})
        </p>
      </div>
    ),
    enableSorting: false,
    size: 200,
  }),
  roleCh.accessor('createdAt', {
    header: 'Dibuat Pada',
    cell: (info) => (
      <p className="text-nowrap">
        {toDateTimeStamp(info.row.original.createdAt)}
      </p>
    ),
    enableSorting: false,
  }),
  roleCh.accessor('updatedAt', {
    header: 'Diubah Pada',
    cell: (info) => (
      <p className="text-nowrap">
        {toDateTimeStamp(info.row.original.createdAt)}
      </p>
    ),
    enableSorting: false,
  }),
]

function RolesTable() {
  const ds = useDataTableState()
  const { data, isLoading } = useQuery(
    roleApi.list.query({
      ...ds.pagination,
    }),
  )

  const table = useDataTable({
    columns: roleColumns,
    data: data?.data ?? [],
    pageCount: data?.meta.totalPages ?? 0,
    rowCount: data?.meta.total ?? 0,
    ds,
  })

  return (
    <DataTableCard
      table={table}
      isLoading={isLoading}
      recordCount={data?.meta.total || 0}
      action={<Button size="sm">Tambah Role</Button>}
    />
  )
}

const locationCh = createColumnHelper<LocationDto>()
const locationColumns = [
  locationCh.accessor('name', {
    header: ({ column }) => (
      <DataGridColumnHeader
        title="Nama Role"
        visibility={true}
        column={column}
      />
    ),
    cell: (info) => (
      <div className="flex gap-2 flex-col">
        <p>{info.row.original.name}</p>
        <p className="text-muted-foreground text-xs italic">
          ({info.row.original.code})
        </p>
      </div>
    ),
    enableSorting: false,
    size: 200,
  }),
  locationCh.accessor('createdAt', {
    header: 'Dibuat Pada',
    cell: (info) => (
      <p className="text-nowrap">
        {toDateTimeStamp(info.row.original.createdAt)}
      </p>
    ),
    enableSorting: false,
  }),
  locationCh.accessor('updatedAt', {
    header: 'Diubah Pada',
    cell: (info) => (
      <p className="text-nowrap">
        {toDateTimeStamp(info.row.original.createdAt)}
      </p>
    ),
    enableSorting: false,
  }),
]

function LocationsTable() {
  const ds = useDataTableState()
  const { data, isLoading } = useQuery(
    locationApi.list.query({
      ...ds.pagination,
    }),
  )

  const table = useDataTable({
    columns: locationColumns,
    data: data?.data ?? [],
    pageCount: data?.meta.totalPages ?? 0,
    rowCount: data?.meta.total ?? 0,
    ds,
  })

  return (
    <DataTableCard
      table={table}
      isLoading={isLoading}
      recordCount={data?.meta.total || 0}
      action={<Button size="sm">Tambah Lokasi</Button>}
    />
  )
}
