import { createFileRoute } from '@tanstack/react-router'
import { Page } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export const Route = createFileRoute('/_app/examples/layouts/one')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <Page>
      <Page.Header className="items-center">
        <Page.Title className="grow">Page One</Page.Title>
        <Page.Actions>
          <Button variant="outline">Tambah Data</Button>
          <Button>Tambah Data</Button>
        </Page.Actions>
      </Page.Header>
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
            </p>
          </Card.Content>
        </Card>
      </Page.Content>
    </Page>
  )
}
