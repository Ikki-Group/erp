import { UserFormPage } from '@/features/iam/components/user-form-page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/settings-new/users/create')({
  component: RouteComponent,
})

function RouteComponent() {
  return <UserFormPage mode="create" backTo={{ to: '/settings-new' }} />
}
