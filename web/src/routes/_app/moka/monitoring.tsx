import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/moka/monitoring')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/moka/monitoring"!</div>
}
