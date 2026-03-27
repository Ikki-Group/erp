import { createFileRoute } from '@tanstack/react-router'

import { MaterialFormPage } from '@/features/material/components/material-form-page'

export const Route = createFileRoute('/_app/material/create')({ component: RouteComponent })

/**
 * Renders the material creation page.
 *
 * Provides a MaterialFormPage configured for creating a material and includes back navigation targeting `/material`.
 *
 * @returns A JSX element rendering MaterialFormPage in `'create'` mode with back navigation to `'/material'`.
 */
function RouteComponent() {
  return <MaterialFormPage mode="create" backTo={{ from: Route.fullPath, to: '/material' }} />
}
