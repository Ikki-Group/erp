import { createFileRoute } from '@tanstack/react-router'

import { LocationFormPage } from '@/features/location/components/location-form-page'

export const Route = createFileRoute('/_app/location/$id/edit')({ component: RouteComponent })

function RouteComponent() {
  const { id } = Route.useParams()
  return <LocationFormPage mode="update" id={Number(id)} backTo={{ from: Route.fullPath, to: '/location' }} />
}
