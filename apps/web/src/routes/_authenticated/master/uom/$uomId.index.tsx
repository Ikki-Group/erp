import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { ArrowLeftIcon, ArrowRightIcon, PencilIcon, TrashIcon } from 'lucide-react'

import {
	ActionMenu,
	AuditInfo,
	DetailBoundary,
	DetailList,
	DetailPage,
	DetailSection,
	PageError,
	usePermissionCheck,
} from '@/components/shared'
import { confirm } from '@/components/shared/confirm'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/toast'

import { conversionResource, uomResource } from '@/features/uom/api.ts'
import { UOM_CATEGORY_OPTIONS } from '@/features/uom/dto/index.ts'
import type { UomDto } from '@/features/uom/dto/index.ts'

export const Route = createFileRoute('/_authenticated/master/uom/$uomId/')({
	component: UomDetailPage,
})

function UomDetailPage() {
	const { uomId } = Route.useParams()
	const detailQuery = useQuery(uomResource.detail.queryOptions({ id: Number(uomId) }))

	return (
		<DetailBoundary query={detailQuery}>
			{(response) => <UomDetail unit={response.data} />}
		</DetailBoundary>
	)
}

function UomDetail({ unit }: { unit: UomDto }) {
	const navigate = useNavigate()
	const canEdit = usePermissionCheck({ permission: 'uom.update' })
	const canDelete = usePermissionCheck({ permission: 'uom.delete' })
	const removeMut = useMutation(uomResource.remove.mutationOptions())

	// ponytail: server caps `limit` at 100; labels beyond the first 100 units fall back to `#id`.
	const unitsQuery = useQuery(uomResource.list.queryOptions({ page: 1, limit: 100 }))
	const conversionsQuery = useQuery(conversionResource.list.queryOptions(undefined))
	const conversions = (conversionsQuery.data?.data ?? []).filter(
		(c) => c.fromUomId === unit.id || c.toUomId === unit.id,
	)
	const unitLabel = (id: number) => {
		const u = unitsQuery.data?.data.find((x) => x.id === id)
		return u ? `${u.name} (${u.code})` : `#${id}`
	}

	const backToList = () => navigate({ to: '/master/uom' })

	const handleDelete = async () => {
		await confirm({
			title: 'Delete unit?',
			description: `This will permanently delete "${unit.name}" (${unit.code}). This action cannot be undone.`,
			confirmLabel: 'Delete',
			variant: 'destructive',
			onConfirm: async () => {
				await removeMut.mutateAsync({ id: unit.id })
				toast.add({ title: 'Unit deleted successfully.', type: 'success' })
				backToList()
			},
		})
	}

	return (
		<DetailPage
			title={unit.name}
			description={unit.code}
			breadcrumbs={
				<Button variant="ghost" size="sm" className="-ml-2 gap-1.5" onClick={backToList}>
					<ArrowLeftIcon className="size-3.5" />
					Units of Measure
				</Button>
			}
			actions={
				<>
					{canEdit && (
						<Button
							size="sm"
							onClick={() =>
								navigate({
									to: '/master/uom/$uomId/edit',
									params: { uomId: String(unit.id) },
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
									label: 'Delete unit',
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
						{ label: 'Code', value: <span className="font-mono">{unit.code}</span> },
						{
							label: 'Category',
							value:
								UOM_CATEGORY_OPTIONS.find((o) => o.value === unit.category)?.label ?? unit.category,
						},
					]}
				/>
				<AuditInfo
					createdAt={unit.createdAt}
					createdBy={unit.createdBy}
					updatedAt={unit.updatedAt}
					updatedBy={unit.updatedBy}
				/>
			</DetailSection>

			<DetailSection
				title="Conversions"
				description="Conversion factors that involve this unit. Manage them from the units list."
				className="border-t pt-6"
			>
				{conversionsQuery.isError ? (
					<PageError
						message="Could not load conversions."
						onRetry={() => void conversionsQuery.refetch()}
					/>
				) : conversionsQuery.isLoading ? (
					<Skeleton className="h-20 w-full" />
				) : conversions.length === 0 ? (
					<p className="text-xs text-muted-foreground">No conversions involve this unit yet.</p>
				) : (
					<ul className="divide-y rounded-lg border">
						{conversions.map((conv) => (
							<li
								key={conv.id}
								className="flex min-h-10 flex-wrap items-center gap-2 px-4 py-1.5 text-sm"
							>
								<span>{unitLabel(conv.fromUomId)}</span>
								<ArrowRightIcon className="size-3.5 text-muted-foreground" aria-label="to" />
								<span>{unitLabel(conv.toUomId)}</span>
								<span className="font-mono text-xs tabular-nums text-muted-foreground">
									× {conv.factor}
								</span>
							</li>
						))}
					</ul>
				)}
			</DetailSection>
		</DetailPage>
	)
}
