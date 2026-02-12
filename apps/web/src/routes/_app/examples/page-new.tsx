import { CardStat, CardStatProps } from '@/components/card/card-stat'
import { Page } from '@/components/layout/page'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Table } from '@/components/ui/table'
import { Tabs } from '@/components/ui/tabs'
import { createFileRoute } from '@tanstack/react-router'
import {
  MapPinIcon,
  MoreHorizontalIcon,
  PlusIcon,
  ShieldEllipsisIcon,
  UsersIcon,
} from 'lucide-react'

export const Route = createFileRoute('/_app/examples/page-new')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <Page>
      <Page.SimpleHeader
        title="Pengaturan"
        description="Kelola preferensi, pengguna, dan konfigurasi sistem Anda."
      />
      <Page.Content className="flex flex-wrap gap-4">
        {MOCK_STATS.map((stat) => (
          <CardStat key={stat.title} {...stat} />
        ))}
      </Page.Content>
      <Separator />
      <Page.Content>
        <Tabs className="mb-4">
          <Tabs.List>
            <Tabs.Trigger value="tab-1">Pengguna</Tabs.Trigger>
            <Tabs.Trigger value="tab-2">Role</Tabs.Trigger>
            <Tabs.Trigger value="tab-3">Lokasi</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab-1">Content 1</Tabs.Content>
          <Tabs.Content value="tab-2">Content 2</Tabs.Content>
          <Tabs.Content value="tab-3">Content 3</Tabs.Content>
        </Tabs>
        <Card className="py-0 gap-0 border">
          <Card.Header className="border-b pt-4">
            <Card.Title>Data Pengguna</Card.Title>
            <Card.Description>Kelola data pengguna sistem.</Card.Description>
            <Card.Action>
              <Button>
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
                        variant={
                          user.role === 'Admin' ? 'default' : 'secondary'
                        }
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
        </Card>
      </Page.Content>
    </Page>
  )
}

const MOCK_STATS: CardStatProps[] = [
  {
    title: 'Total User',
    value: '20',
    icon: UsersIcon,
  },
  {
    title: 'Total Role',
    value: '6',
    icon: ShieldEllipsisIcon,
  },
  {
    title: 'Total Lokasi',
    value: '2',
    icon: MapPinIcon,
  },
]

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
