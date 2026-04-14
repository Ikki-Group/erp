// oxlint-disable max-lines
// oxlint-disable no-negated-condition
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ChefHatIcon, EditIcon, InfoIcon, MapPinIcon, PlusIcon, ScaleIcon } from 'lucide-react'

import { CardSection } from '@/components/blocks/card/card-section'
import { BadgeDot } from '@/components/blocks/data-display/badge-dot'
import { DataList } from '@/components/blocks/data-display/data-list'
import { Page } from '@/components/layout/page'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { recipeApi } from '@/features/recipe'
import { toNumber } from '@/lib/formatter'
import { cn } from '@/lib/utils'

import { materialApi, materialLocationApi } from '../api'
import { MaterialBadgeProps } from '../utils'
import { MaterialAssignToLocationDialog } from './material-assign-to-location-dialog'

interface MaterialDetailPageProps {
	id: number
}

export function MaterialDetailPage({ id }: MaterialDetailPageProps) {
	// 1. Core Material Detail
	const { data: materialResult } = useSuspenseQuery({ ...materialApi.detail.query({ id }) })

	// 2. Assigned Locations (enriched)
	const { data: locationsResult } = useSuspenseQuery({
		...materialLocationApi.byMaterial.query({ id }),
	})

	// 3. Recipe (if semi-finished)
	const { data: recipesResult } = useSuspenseQuery({
		...recipeApi.list.query({ materialId: id }),
		// useSuspenseQuery doesn't strictly adhere to 'enabled' in the same way for types,
		// but Elysia/Eden Treaty responses usually handle this.
		// However, for Suspense we might need to handle the semi-finished logic differently if the query is skipped.
		// In this case, we can keep it as is since it's a list fetch.
	})

	const material = materialResult.data
	const locations = locationsResult.data ?? []
	const recipe = recipesResult.data?.[0]

	return (
		<Page size="lg">
			<Page.BlockHeader
				title={material.name}
				description={`Detail informasi untuk bahan baku ${material.sku}`}
				back={{ to: '/material' }}
				action={
					<div className="flex items-center gap-2">
						<Link
							to="/material/$id/update"
							params={{ id: String(id) }}
							className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
						>
							<EditIcon className="mr-2 size-4" />
							Edit Bahan Baku
						</Link>
						<Button
							size="sm"
							onClick={() => {
								MaterialAssignToLocationDialog.call({
									materialIds: [id],
									materialName: material.name,
								})
							}}
						>
							<PlusIcon className="mr-2 size-4" />
							Assign ke Lokasi
						</Button>
					</div>
				}
			/>

			<Page.Content className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Left Column: Information & Recipe */}
				<div className="lg:col-span-2 space-y-6">
					{/* Basic Info */}
					<CardSection title="Informasi Dasar" icon={<InfoIcon className="size-4 text-primary" />}>
						<DataList cols={3}>
							<DataList.Item label="Nama Bahan Baku" value={material.name} />
							<DataList.Item
								label="SKU"
								value={<span className="font-mono">{material.sku}</span>}
							/>
							<DataList.Item label="Jenis">
								<BadgeDot {...MaterialBadgeProps[material.type]} />
							</DataList.Item>
							<DataList.Item label="Kategori" value={material.category?.name ?? '-'} />
							<DataList.Item label="Satuan Dasar" value={material.uom?.code} />

							<DataList.Item label="Deskripsi" span={3}>
								<div className="mt-2 pt-2 border-t">
									<p className="text-sm text-muted-foreground leading-relaxed">
										{material.description ?? '-'}
									</p>
								</div>
							</DataList.Item>
						</DataList>
					</CardSection>

					{/* UOM Conversions */}
					<CardSection title="Konversi Satuan" icon={<ScaleIcon className="size-4 text-primary" />}>
						<div className="border rounded-md overflow-hidden">
							<Table>
								<TableHeader className="bg-muted/50">
									<TableRow>
										<TableHead>Satuan</TableHead>
										<TableHead className="text-right">Konversi ke Dasar</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{material.conversions.map((conv) => (
										<TableRow key={conv.uomId}>
											<TableCell className="font-medium">
												1{' '}
												{conv.uomId === material.baseUomId
													? material.uom?.code
													: (conv.uom?.code ?? `UOM #${conv.uomId}`)}
											</TableCell>
											<TableCell className="text-right font-mono text-xs">
												{toNumber(conv.toBaseFactor)} {material.uom?.code}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</CardSection>

					{/* Recipe Details (for semi-finished) */}
					{material.type === 'semi' && (
						<CardSection
							title="Detail Resep"
							icon={<ChefHatIcon className="size-4 text-primary" />}
							action={
								<Link
									to="/material/$id/recipe"
									params={{ id: String(id) }}
									className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'h-8')}
								>
									{recipe ? 'Perbarui Resep' : 'Buat Resep'}
								</Link>
							}
						>
							{!recipe ? (
								<div className="flex flex-col items-center justify-center py-8 bg-muted/20 rounded-lg border border-dashed text-center gap-3">
									<ChefHatIcon className="size-10 opacity-10" />
									<div className="space-y-1">
										<p className="text-sm font-semibold">Belum Ada Resep</p>
										<p className="text-xs text-muted-foreground max-w-[240px]">
											Bahan setengah jadi ini memerlukan resep untuk proses produksinya.
										</p>
									</div>
									<Link
										to="/material/$id/recipe"
										params={{ id: String(id) }}
										className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
									>
										Buat Resep Sekarang
									</Link>
								</div>
							) : (
								<div className="space-y-4">
									<div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/10">
										<div className="flex flex-col gap-0.5">
											<span className="text-[10px] font-bold text-muted-foreground uppercase">
												Hasil Produksi (Yield)
											</span>
											<span className="text-sm font-bold">
												{toNumber(recipe.targetQty)} {material.uom?.code}
											</span>
										</div>
										<div className="flex flex-col items-end gap-0.5">
											<span className="text-[10px] font-bold text-muted-foreground uppercase">
												Status
											</span>
											<span
												className={cn(
													'text-[10px] font-bold px-1.5 py-0.5 rounded',
													recipe.isActive
														? 'bg-green-100 text-green-700'
														: 'bg-red-100 text-red-700',
												)}
											>
												{recipe.isActive ? 'AKTIF' : 'NON-AKTIF'}
											</span>
										</div>
									</div>

									{recipe.instructions && (
										<div className="p-3 bg-muted/30 rounded-lg border">
											<span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
												Instruksi
											</span>
											<p className="text-xs whitespace-pre-line leading-relaxed">
												{recipe.instructions}
											</p>
										</div>
									)}

									<div className="border rounded-md overflow-hidden">
										<Table>
											<TableHeader className="bg-muted/50">
												<TableRow>
													<TableHead>Bahan Komponen</TableHead>
													<TableHead className="text-right">Jumlah</TableHead>
													<TableHead className="text-right">Loss (%)</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{recipe.items?.map((item) => (
													<TableRow key={item.id}>
														<TableCell className="text-sm">
															<div className="flex flex-col">
																<span className="font-medium">
																	{item.material?.name ?? `Material #${item.materialId}`}
																</span>
																<span className="text-[10px] font-mono text-muted-foreground">
																	{item.material?.sku}
																</span>
															</div>
														</TableCell>
														<TableCell className="text-right text-xs font-mono">
															{toNumber(item.qty)} {item.uom?.code ?? `(UOM #${item.uomId})`}
														</TableCell>
														<TableCell className="text-right text-xs">
															{toNumber(item.scrapPercentage)} %
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
								</div>
							)}
						</CardSection>
					)}
				</div>

				{/* Right Column: Locations & Stats */}
				<div className="space-y-6">
					{/* Assigned Locations */}
					<Card size="sm" className="overflow-hidden">
						<div className="p-4 border-b bg-muted/30 flex items-center justify-between">
							<div className="flex items-center gap-2">
								<MapPinIcon className="size-4 text-primary" />
								<h3 className="text-sm font-bold">Lokasi Tersimpan</h3>
							</div>
							<span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
								{locations.length}
							</span>
						</div>
						<div className="p-2">
							{locations.length === 0 ? (
								<div className="py-8 text-center px-4">
									<p className="text-xs text-muted-foreground mb-3">
										Belum di-assign ke lokasi mana pun.
									</p>
									<Button
										variant="outline"
										size="sm"
										className="w-full"
										onClick={() => {
											MaterialAssignToLocationDialog.call({
												materialIds: [id],
												materialName: material.name,
											})
										}}
									>
										Assign Sekarang
									</Button>
								</div>
							) : (
								<div className="space-y-1">
									{locations.map((loc) => (
										<div
											key={loc.id}
											className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors border-b last:border-0 group"
										>
											<div className="flex flex-col">
												<span className="text-sm font-medium">{loc.location.name}</span>
												<span className="text-[10px] font-mono text-muted-foreground uppercase">
													{loc.location.code}
												</span>
											</div>
											<div className="flex flex-col items-end gap-1">
												<span className="text-[10px] px-1.5 py-0.5 rounded bg-muted font-bold text-muted-foreground uppercase">
													{loc.location.type}
												</span>
											</div>
										</div>
									))}
									<div className="mt-2 p-2">
										<Button
											variant="ghost"
											size="sm"
											className="w-full h-8 text-xs text-primary"
											onClick={() => {
												MaterialAssignToLocationDialog.call({
													materialIds: [id],
													materialName: material.name,
												})
											}}
										>
											<PlusIcon className="mr-1 size-3" />
											Kelola Lokasi
										</Button>
									</div>
								</div>
							)}
						</div>
					</Card>

					{/* System Metadata */}
					<Card size="sm" className="bg-muted/10 border-dashed">
						<div className="p-4">
							<DataList cols={1}>
								<DataList.Item label="Terakhir Diperbarui">
									{new Date(material.updatedAt).toLocaleString('id-ID', {
										dateStyle: 'long',
										timeStyle: 'short',
									})}
								</DataList.Item>
								<DataList.Item label="ID Sistem (Internal)">
									<span className="font-mono text-muted-foreground">#{material.id}</span>
								</DataList.Item>
							</DataList>
						</div>
					</Card>
				</div>
			</Page.Content>
		</Page>
	)
}
