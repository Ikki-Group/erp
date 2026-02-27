import { createFileRoute } from '@tanstack/react-router'
import { LocationFormPage } from '@/features/location/components/location-form-page'

export const Route = createFileRoute('/_app/settings/location/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  return (
    <LocationFormPage
      mode="update"
      id={id}
      backTo={{
        from: Route.fullPath,
        to: '/settings/location',
      }}
    />
  )
}
