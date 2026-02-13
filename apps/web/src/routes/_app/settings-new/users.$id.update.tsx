import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/settings-new/users/$id/update')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/settings-new/users/$id/"!</div>
}
