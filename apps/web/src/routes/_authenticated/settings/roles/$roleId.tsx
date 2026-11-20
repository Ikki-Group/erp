import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { ArrowLeftIcon } from 'lucide-react'

import { DetailBoundary } from '@/components/shared/detail-boundary.tsx'
import { DetailPage } from '@/components/shared/detail-page'
import { EntityEditorPage } from '@/components/shared/entity-editor-page'

import { Button } from '@/components/ui/button'

import { roleResource } from '@/features/iam/api.ts'
import { RoleDetails, RoleFormFields, useRoleForm } from '@/features/iam/components/role-form.tsx'
import type { RoleDto } from '@/features/iam/dto/index.ts'

export const Route = createFileRoute('/_authenticated/settings/roles/$roleId')({
	component: RoleDetailPage,
})

function RoleDetailPage() {
	const { roleId } = Route.useParams()
	const navigate = useNavigate()
	const detailQuery = useQuery({
		...roleResource.detail.queryOptions({ id: Number(roleId) }),
		throwOnError: false,
	})

	return (
		<DetailBoundary query={detailQuery}>
			{(response) =>
				response.data.isSystem ? (
					<SystemRoleDetail
						key={response.data.id}
						role={response.data}
						onDone={() => navigate({ to: '/settings/access-control', search: { tab: 'roles' } })}
					/>
				) : (
					<EditRoleForm
						key={response.data.id}
						role={response.data}
						onDone={() => navigate({ to: '/settings/access-control', search: { tab: 'roles' } })}
					/>
				)
			}
		</DetailBoundary>
	)
}

interface RolePageProps {
	role: RoleDto
	onDone: () => void
}

function SystemRoleDetail({ role, onDone }: RolePageProps) {
	return (
		<DetailPage
			title="Detail Peran Sistem"
			description={`${role.name} dikelola oleh sistem dan tidak dapat diubah.`}
			actions={
				<Button variant="outline" size="sm" onClick={onDone}>
					<ArrowLeftIcon />
					Kembali
				</Button>
			}
			className="mx-auto max-w-2xl"
		>
			<RoleDetails role={role} />
		</DetailPage>
	)
}

function EditRoleForm({ role, onDone }: RolePageProps) {
	const form = useRoleForm({ role, onSaved: onDone })

	return (
		<EntityEditorPage
			title="Ubah Peran"
			description={`Update permissions for ${role.name}.`}
			form={form}
			submitLabel="Simpan Perubahan"
			onCancel={onDone}
		>
			<RoleFormFields form={form} />
		</EntityEditorPage>
	)
}
