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
import { supplierResource } from '@/features/supplier/api.ts'
import { PricingTable } from '@/features/supplier/components/pricing-table.tsx'
import type { SupplierDto } from '@/features/supplier/dto/index.ts'

export const Route = createFileRoute('/_authenticated/master/suppliers/$supplierId/')({
	component: SupplierDetailPage,
})

function SupplierDetailPage() {
	const { supplierId } = Route.useParams()
	const detailQuery = useQuery(supplierResource.detail.queryOptions({ id: Number(supplierId) }))

	return (
		<DetailBoundary query={detailQuery}>
			{(response) => <SupplierDetail supplier={response.data} />}
		</DetailBoundary>
	)
}

function SupplierDetail({ supplier }: { supplier: SupplierDto }) {
	const navigate = useNavigate()
	const canEdit = usePermissionCheck({ permission: 'supplier.update' })
	const canDelete = usePermissionCheck({ permission: 'supplier.delete' })
	const canReadAudit = usePermissionCheck({ permission: 'audit.read' })
	const auditQuery = useQuery({
		...auditResource.byEntity.queryOptions({ entity: 'supplier', entityId: supplier.id }),
		enabled: canReadAudit,
	})
	const removeMut = useMutation(supplierResource.remove.mutationOptions())

	const backToList = () => navigate({ to: '/master/suppliers' })

	const handleDelete = async () => {
		await confirm({
			title: 'Delete supplier?',
			description: `This will permanently delete "${supplier.name}" (${supplier.code}). This action cannot be undone.`,
			confirmLabel: 'Delete',
			variant: 'destructive',
			onConfirm: async () => {
				await removeMut.mutateAsync({ id: supplier.id })
				toast.add({ title: 'Supplier deleted successfully.', type: 'success' })
				backToList()
			},
		})
	}

	return (
		<DetailPage
			title={supplier.name}
			description={supplier.code}
			breadcrumbs={
				<Button variant="ghost" size="sm" className="-ml-2 gap-1.5" onClick={backToList}>
					<ArrowLeftIcon className="size-3.5" />
					Suppliers
				</Button>
			}
			status={
				<StatusBadge variant={supplier.isActive ? 'success' : 'outline'}>
					{supplier.isActive ? 'Active' : 'Inactive'}
				</StatusBadge>
			}
			actions={
				<>
					{canEdit && (
						<Button
							size="sm"
							onClick={() =>
								navigate({
									to: '/master/suppliers/$supplierId/edit',
									params: { supplierId: String(supplier.id) },
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
									label: 'Delete supplier',
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
			<DetailSection title="Contact">
				<DetailList
					columns={3}
					items={[
						{ label: 'Code', value: <span className="font-mono">{supplier.code}</span> },
						{ label: 'Contact person', value: supplier.contactPerson || '—' },
						{ label: 'Phone', value: supplier.phone || '—' },
						{ label: 'Email', value: supplier.email || '—' },
						{ label: 'Address', value: supplier.address || '—' },
						{
							label: 'Payment terms',
							value:
								supplier.paymentTerms === null ? (
									'—'
								) : (
									<span className="tabular-nums">{supplier.paymentTerms} days</span>
								),
						},
					]}
				/>
				<AuditInfo
					createdAt={supplier.createdAt}
					createdBy={supplier.createdBy}
					updatedAt={supplier.updatedAt}
					updatedBy={supplier.updatedBy}
				/>
			</DetailSection>

			<DetailSection title="Material pricing" className="border-t pt-6">
				<PricingTable supplierId={supplier.id} />
			</DetailSection>

			{canReadAudit && (
				<DetailSection
					title="Activity"
					description="Recent changes to this supplier."
					className="border-t pt-6"
				>
					<AuditTrail
						entries={auditQuery.data?.data ?? []}
						isLoading={auditQuery.isLoading}
						emptyMessage="No changes recorded for this supplier yet."
					/>
				</DetailSection>
			)}
		</DetailPage>
	)
}
