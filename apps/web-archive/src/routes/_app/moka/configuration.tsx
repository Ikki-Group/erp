import { createFileRoute } from '@tanstack/react-router'

import { MokaIntegrationPage } from '@/features/moka'

export const Route = createFileRoute('/_app/moka/configuration')({
	component: MokaIntegrationPage,
})
