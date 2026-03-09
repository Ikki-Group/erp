import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/sales/customers')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/sales/customers"!</div>
}
