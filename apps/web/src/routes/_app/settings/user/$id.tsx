import { createFileRoute } from '@tanstack/react-router'

import { userApi } from '@/features/iam'
import { UserFormPage } from '@/features/iam/components/user-form-page'

export const Route = createFileRoute('/_app/settings/user/$id')({
	loader: async ({ params, context }) => {
		await context.qc.ensureQueryData(userApi.detail.query({ id: Number(params.id) }))
	},
	component: RouteComponent,
})

function RouteComponent() {
	const { id } = Route.useParams()
	return <UserFormPage mode="update" id={Number(id)} backTo={{ to: '/settings/user' }} />
}
