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
import { categoryResource, materialResource } from '@/features/material/api.ts'
import { LocationAssignment } from '@/features/material/components/location-assignment.tsx'
import { MATERIAL_TYPE_OPTIONS } from '@/features/material/dto/index.ts'
import type { MaterialDto } from '@/features/material/dto/index.ts'
import { uomResource } from '@/features/uom/api.ts'

export const Route = createFileRoute('/_authenticated/master/materials/$materialId/')({
	component: MaterialDetailPage,
})

function MaterialDetailPage() {
	const { materialId } = Route.useParams()
	const detailQuery = useQuery(materialResource.detail.queryOptions({ id: Number(materialId) }))

	return (
		<DetailBoundary query={detailQuery}>
			{(response) => <MaterialDetail material={response.data} />}
		</DetailBoundary>
	)
}

function MaterialDetail({ material }: { material: MaterialDto }) {
	const navigate = useNavigate()
	const canEdit = usePermissionCheck({ permission: 'material.update' })
	const canDelete = usePermissionCheck({ permission: 'material.delete' })
	const canAssign = usePermissionCheck({ permission: 'material.create' }) || canDelete
	const canReadAudit = usePermissionCheck({ permission: 'audit.read' })

	const categoriesQuery = useQuery(categoryResource.list.queryOptions({ page: 1, limit: 100 }))
	const uomQuery = useQuery(uomResource.list.queryOptions({ page: 1, limit: 100 }))
	const auditQuery = useQuery({
		...auditResource.byEntity.queryOptions({ entity: 'material', entityId: material.id }),
		enabled: canReadAudit,
	})
	const removeMut = useMutation(materialResource.remove.mutationOptions())

	const uomLabel = (id: number | null) => {
		if (id === null) return <span className="text-muted-foreground">Same as base</span>
		const uom = uomQuery.data?.data.find((u) => u.id === id)
		return uom ? `${uom.name} (${uom.code})` : '—'
	}
	const categoryName =
		material.categoryId === null
			? '—'
			: (categoriesQuery.data?.data.find((c) => c.id === material.categoryId)?.name ?? '—')
	const typeLabel =
		MATERIAL_TYPE_OPTIONS.find((o) => o.value === material.type)?.label ?? material.type

	const backToList = () => navigate({ to: '/master/materials' })

	const handleDelete = async () => {
		await confirm({
			title: 'Deactivate material?',
			description: `"${material.name}" (${material.code}) will be hidden from pickers and new documents. Its stock history is kept.`,
			confirmLabel: 'Deactivate',
			variant: 'destructive',
			onConfirm: async () => {
				await removeMut.mutateAsync({ id: material.id })
				toast.add({ title: 'Material deactivated.', type: 'success' })
				backToList()
			},
		})
	}

	return (
		<DetailPage
			title={material.name}
			description={material.code}
			breadcrumbs={
				<Button variant="ghost" size="sm" className="-ml-2 gap-1.5" onClick={backToList}>
					<ArrowLeftIcon className="size-3.5" />
					Materials
				</Button>
			}
			status={
				<StatusBadge variant={material.isActive ? 'success' : 'outline'}>
					{material.isActive ? 'Active' : 'Inactive'}
				</StatusBadge>
			}
			actions={
				<>
					{canEdit && (
						<Button
							size="sm"
							onClick={() =>
								navigate({
									to: '/master/materials/$materialId/edit',
									params: { materialId: String(material.id) },
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
									label: 'Deactivate material',
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
						{ label: 'Code', value: <span className="font-mono">{material.code}</span> },
						{ label: 'Type', value: typeLabel },
						{ label: 'Category', value: categoryName },
						{
							label: 'Min stock',
							value: material.minStock ? (
								<span className="font-mono tabular-nums">
									{Number(material.minStock).toLocaleString('id-ID')}
								</span>
							) : (
								'—'
							),
						},
					]}
				/>
				<AuditInfo
					createdAt={material.createdAt}
					createdBy={material.createdBy}
					updatedAt={material.updatedAt}
					updatedBy={material.updatedBy}
				/>
			</DetailSection>

			<DetailSection
				title="Units"
				description="Stock is stored in the base unit. Defaults fall back to it."
				className="border-t pt-6"
			>
				<DetailList
					columns={2}
					items={[
						{ label: 'Base unit', value: uomLabel(material.baseUomId) },
						{ label: 'Purchase unit', value: uomLabel(material.defaultPurchaseUomId) },
						{ label: 'Stock unit', value: uomLabel(material.defaultStockUomId) },
						{ label: 'Recipe unit', value: uomLabel(material.defaultRecipeUomId) },
					]}
				/>
			</DetailSection>

			<DetailSection
				title="Locations"
				description="Which locations stock this material."
				className="border-t pt-6"
			>
				<LocationAssignment materialId={material.id} readOnly={!canAssign} />
			</DetailSection>

			{canReadAudit && (
				<DetailSection
					title="Activity"
					description="Recent changes to this material."
					className="border-t pt-6"
				>
					<AuditTrail
						entries={auditQuery.data?.data ?? []}
						isLoading={auditQuery.isLoading}
						emptyMessage="No changes recorded for this material yet."
					/>
				</DetailSection>
			)}
		</DetailPage>
	)
}
