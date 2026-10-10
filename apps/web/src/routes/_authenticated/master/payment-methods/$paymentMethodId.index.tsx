import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { ArrowLeftIcon, PencilIcon, TrashIcon } from 'lucide-react'

import {
	ActionMenu,
	AuditInfo,
	AuditTrail,
	DetailBoundary,
	DetailList,
	DetailPage,
	DetailSection,
	StatusBadge,
	usePermissionCheck,
} from '@/components/shared'
import { confirm } from '@/components/shared/confirm'

import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

import { auditResource } from '@/features/audit/api.ts'
import { paymentMethodResource } from '@/features/payment-method/api.ts'
import { PAYMENT_METHOD_TYPE_OPTIONS } from '@/features/payment-method/dto/index.ts'
import type { PaymentMethodDto } from '@/features/payment-method/dto/index.ts'

export const Route = createFileRoute('/_authenticated/master/payment-methods/$paymentMethodId/')({
	component: PaymentMethodDetailPage,
})

function PaymentMethodDetailPage() {
	const { paymentMethodId } = Route.useParams()
	const detailQuery = useQuery(
		paymentMethodResource.detail.queryOptions({ id: Number(paymentMethodId) }),
	)

	return (
		<DetailBoundary query={detailQuery}>
			{(response) => <PaymentMethodDetail method={response.data} />}
		</DetailBoundary>
	)
}

function PaymentMethodDetail({ method }: { method: PaymentMethodDto }) {
	const navigate = useNavigate()
	const canEdit = usePermissionCheck({ permission: 'payment-method.update' })
	const canDelete = usePermissionCheck({ permission: 'payment-method.delete' })
	const canReadAudit = usePermissionCheck({ permission: 'audit.read' })
	const auditQuery = useQuery({
		...auditResource.byEntity.queryOptions({ entity: 'payment_method', entityId: method.id }),
		enabled: canReadAudit,
	})
	const removeMut = useMutation(paymentMethodResource.remove.mutationOptions())

	const backToList = () => navigate({ to: '/master/payment-methods' })

	const handleDelete = async () => {
		await confirm({
			title: 'Delete payment method?',
			description: `This will permanently delete "${method.name}" (${method.code}). This action cannot be undone.`,
			confirmLabel: 'Delete',
			variant: 'destructive',
			onConfirm: async () => {
				await removeMut.mutateAsync({ id: method.id })
				toast.add({ title: 'Payment method deleted.', type: 'success' })
				backToList()
			},
		})
	}

	return (
		<DetailPage
			title={method.name}
			description={method.code}
			breadcrumbs={
				<Button variant="ghost" size="sm" className="-ml-2 gap-1.5" onClick={backToList}>
					<ArrowLeftIcon className="size-3.5" />
					Payment Methods
				</Button>
			}
			status={
				<StatusBadge variant={method.isActive ? 'success' : 'outline'}>
					{method.isActive ? 'Active' : 'Inactive'}
				</StatusBadge>
			}
			actions={
				<>
					{canEdit && (
						<Button
							size="sm"
							onClick={() =>
								navigate({
									to: '/master/payment-methods/$paymentMethodId/edit',
									params: { paymentMethodId: String(method.id) },
								})
							}
						>
							<PencilIcon className="size-4" />
							Edit
						</Button>
					)}
					{canDelete && (
						<ActionMenu
							label="More actions"
							items={[
								{
									label: 'Delete payment method',
									icon: <TrashIcon />,
									onClick: () => void handleDelete(),
									variant: 'destructive',
								},
							]}
						/>
					)}
				</>
			}
		>
			<DetailSection title="Details">
				<DetailList
					columns={3}
					items={[
						{ label: 'Code', value: <span className="font-mono">{method.code}</span> },
						{
							label: 'Type',
							value:
								PAYMENT_METHOD_TYPE_OPTIONS.find((o) => o.value === method.type)?.label ??
								method.type,
						},
					]}
				/>
				<AuditInfo
					createdAt={method.createdAt}
					createdBy={method.createdBy}
					updatedAt={method.updatedAt}
					updatedBy={method.updatedBy}
				/>
			</DetailSection>

			{canReadAudit && (
				<DetailSection
					title="Activity"
					description="Recent changes to this payment method."
					className="border-t pt-6"
				>
					<AuditTrail
						entries={auditQuery.data?.data ?? []}
						isLoading={auditQuery.isLoading}
						emptyMessage="No changes recorded for this payment method yet."
					/>
				</DetailSection>
			)}
		</DetailPage>
	)
}
