import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { ArrowLeftIcon, PencilIcon, TrashIcon } from 'lucide-react'

import {
	ActionMenu,
	AuditInfo,
	CurrencyDisplay,
	DetailBoundary,
	DetailList,
	DetailPage,
	DetailSection,
	StatusBadge,
	usePermissionCheck,
} from '@/components/shared'
import { confirm } from '@/components/shared/confirm'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

import { menuItemExtras, menuItemResource } from '@/features/menu/api.ts'
import type { MenuItemDetailDto } from '@/features/menu/dto/index.ts'

export const Route = createFileRoute('/_authenticated/master/menu/items/$itemId/')({
	component: MenuItemDetailPage,
})

function MenuItemDetailPage() {
	const { itemId } = Route.useParams()
	const detailQuery = useQuery(menuItemExtras.detail.queryOptions({ id: Number(itemId) }))

	return (
		<DetailBoundary query={detailQuery}>
			{(response) => <MenuItemDetail item={response.data} />}
		</DetailBoundary>
	)
}

function MenuItemDetail({ item }: { item: MenuItemDetailDto }) {
	const navigate = useNavigate()
	const canEdit = usePermissionCheck({ permission: 'item.update' })
	const canDelete = usePermissionCheck({ permission: 'item.delete' })
	const removeMut = useMutation(menuItemResource.remove.mutationOptions())

	const backToList = () => navigate({ to: '/master/menu' })

	const handleDelete = async () => {
		await confirm({
			title: 'Hapus menu item?',
			description: `"${item.name}" (${item.sku}) akan dihapus permanen.`,
			confirmLabel: 'Hapus',
			variant: 'destructive',
			onConfirm: async () => {
				await removeMut.mutateAsync({ id: item.id })
				toast.add({ title: 'Menu item berhasil dihapus.', type: 'success' })
				backToList()
			},
		})
	}

	const isActive = item.status === 'active'

	return (
		<DetailPage
			title={item.name}
			description={item.sku}
			breadcrumbs={
				<Button variant="ghost" size="sm" className="-ml-2 gap-1.5" onClick={backToList}>
					<ArrowLeftIcon className="size-3.5" />
					Menu
				</Button>
			}
			status={
				<StatusBadge variant={isActive ? 'success' : 'outline'}>
					{isActive ? 'Active' : 'Inactive'}
				</StatusBadge>
			}
			actions={
				<>
					{canEdit && (
						<Button
							size="sm"
							onClick={() =>
								navigate({
									to: '/master/menu/items/$itemId/edit',
									params: { itemId: String(item.id) },
								})
							}
						>
							<PencilIcon className="size-4" />
							Edit
						</Button>
					)}
					{canDelete && (
						<ActionMenu
							label="Aksi lainnya"
							items={[
								{
									label: 'Hapus menu item',
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
			<DetailSection title="Detail">
				<DetailList
					columns={3}
					items={[
						{ label: 'SKU', value: <span className="font-mono">{item.sku}</span> },
						{ label: 'Kategori', value: item.category?.name ?? '—' },
						{
							label: 'Harga Dasar',
							value: <CurrencyDisplay value={item.basePrice} className="font-mono tabular-nums" />,
						},
					]}
				/>
				<AuditInfo
					createdAt={item.createdAt}
					createdBy={item.createdBy}
					updatedAt={item.updatedAt}
					updatedBy={item.updatedBy}
				/>
			</DetailSection>

			<DetailSection title="Modifier" className="border-t pt-6">
				{item.modifierGroups.length === 0 ? (
					<p className="text-xs text-muted-foreground">Belum ada modifier group untuk item ini.</p>
				) : (
					<ul className="divide-y rounded-lg border">
						{item.modifierGroups.map((group) => (
							<li key={group.id} className="space-y-2 px-4 py-3">
								<div className="flex flex-wrap items-center gap-2">
									<span className="text-sm font-medium">{group.name}</span>
									<Badge variant="secondary" className="capitalize">
										{group.selectionType}
									</Badge>
									{group.isRequired && <Badge variant="outline">Wajib</Badge>}
								</div>
								{group.options.length > 0 && (
									<ul className="grid max-w-md gap-1 text-sm">
										{group.options.map((opt) => (
											<li key={opt.id} className="flex justify-between gap-4 text-muted-foreground">
												<span>{opt.name}</span>
												<CurrencyDisplay
													value={opt.priceAdjustment}
													className="font-mono text-xs tabular-nums"
												/>
											</li>
										))}
									</ul>
								)}
							</li>
						))}
					</ul>
				)}
			</DetailSection>
		</DetailPage>
	)
}
