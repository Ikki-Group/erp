import { Page } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { createFileRoute } from '@tanstack/react-router'
import { Trash2Icon } from 'lucide-react'

export const Route = createFileRoute('/_app/examples/layouts/two')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <Page>
      <Page.BlockHeader
        border
        title="Pengaturan Akun"
        back={{ from: '/', to: '/settings/user' }}
        description="Kelola preferensi, pengguna, dan konfigurasi sistem Anda."
        action={
          <>
            <Button variant="destructive" size="icon">
              <Trash2Icon />
            </Button>
            <Button variant="outline">Tambah Pengguna</Button>
            <Button>Tambah Pengguna</Button>
          </>
        }
      />
      <Page.Content>
        <Card>
          <Card.Content>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur. Excepteur sint occaecat cupidatat non proident,
              sunt in culpa qui officia deserunt mollit anim id est laborum.
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur. Excepteur sint occaecat cupidatat non proident,
              sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
          </Card.Content>
        </Card>
      </Page.Content>
    </Page>
  )
}
