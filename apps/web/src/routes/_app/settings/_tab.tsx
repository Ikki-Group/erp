import { CardStat, CardStatProps } from '@/components/card/card-stat'
import { Page } from '@/components/layout/page'
import { Tabs } from '@/components/ui/tabs'
import { settingsApi } from '@/features/dashboard/api/settings.api'
import { useSuspenseQuery } from '@tanstack/react-query'
import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
} from '@tanstack/react-router'
import { MapPinIcon, ShieldEllipsisIcon, UsersIcon } from 'lucide-react'

const TABS = [
  ['Pengguna', '/settings/user'],
  ['Role', '/settings/role'],
  ['Lokasi', '/settings/location'],
] as const

export const Route = createFileRoute('/_app/settings/_tab')({
  component: RouteComponent,
})

function RouteComponent() {
  const { pathname } = useLocation()
  return (
    <Page>
      <Page.BlockHeader
        title="Pengaturan"
        description="Kelola preferensi, pengguna, dan konfigurasi sistem Anda."
      />
      <SettingsSummarySection />
      <Page.Content className="mt-4">
        <Tabs value={pathname}>
          <div className="border-b w-full">
            <Tabs.List className="w-full md:w-min" variant="line">
              {TABS.map(([title, path]) => (
                <Tabs.Trigger
                  key={path}
                  className="py-2 px-4"
                  value={path}
                  nativeButton={false}
                  render={<Link to={path} />}
                >
                  {title}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
          </div>
        </Tabs>
      </Page.Content>
      <Page.Content>
        <Outlet />
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
    <Page.Content className="flex flex-wrap gap-2">
      {stats.map((stat) => (
        <CardStat key={stat.title} {...stat} />
      ))}
    </Page.Content>
  )
}
