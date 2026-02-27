import { createFileRoute } from '@tanstack/react-router'
import { LocationFormPage } from '@/features/location/components/location-form-page'

export const Route = createFileRoute('/_app/settings/location/create')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <LocationFormPage mode="create" backTo={{ to: '/settings/location' }} />
  )
}
