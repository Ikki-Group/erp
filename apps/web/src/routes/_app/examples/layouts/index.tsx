import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/_app/examples/layouts/')({
  component: RouteComponent,
})

const ROUTES = [
  getRouteApi('/_app/examples/layouts/one'),
  getRouteApi('/_app/examples/layouts/two'),
]

function RouteComponent() {
  return (
    <div className="flex flex-col gap-4 p-6">
      {ROUTES.map((route) => (
        <Button key={route.id} render={<route.Link />} nativeButton={false}>
          {route.id}
        </Button>
      ))}
    </div>
  )
}
