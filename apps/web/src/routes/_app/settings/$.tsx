import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/settings/$')({
  beforeLoad() {
    return redirect({ to: '/settings/user' })
  },
})
