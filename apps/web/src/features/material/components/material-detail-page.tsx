import { useSuspenseQueries } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import {
	ChefHatIcon,
	EditIcon,
	InfoIcon,
	MapPinIcon,
	PlusIcon,
	ScaleIcon,
} from 'lucide-react'

import { toDateTimeStamp, toNumber } from '@/lib/formatter'
import { cn } from '@/lib/utils'

import { CardSection } from '@/components/blocks/card/card-section'
import { BadgeDot, getActiveStatusBadge } from '@/components/blocks/data-display/badge-dot'
import { DataList } from '@/components/blocks/data-display/data-list'
import { EmptyState } from '@/components/blocks/feedback/empty-state'
import { Page } from '@/components/layout/page'
import { Badge } from '@/components/reui/badge'

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

import type { MaterialConversionDto, MaterialSelectDto } from '../dto'
import type { RecipeSelectDto } from '@/features/recipe'

import { materialApi, materialLocationApi } from '../api'
import type { MaterialLocationWithLocationDto } from '../dto'
import { MaterialBadgeProps } from '../utils'
import { MaterialAssignToLocationDialog } from './material-assign-to-location-dialog'

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface MaterialDetailPageProps {
	readonly id: number
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function openAssignDialog(materialId: number, materialName: string) {
	MaterialAssignToLocationDialog.call({
		materialIds: [materialId],
		materialName,
	})
}

/* -------------------------------------------------------------------------- */
/*  Page (Orchestrator)                                                       */
/* -------------------------------------------------------------------------- */

export function MaterialDetailPage({ id }: MaterialDetailPageProps) {
	const [{ data: materialResult }, { data: locationsResult }, { data: recipesResult }] =
		useSuspenseQueries({
			queries: [
				materialApi.detail.query({ id }),
				materialLocationApi.byMaterial.query({ id }),
				recipeApi.list.query({ materialId: id }),
			],
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
						<Button size="sm" onClick={() => openAssignDialog(id, material.name)}>
							<PlusIcon className="mr-2 size-4" />
							Assign ke Lokasi
						</Button>
					</div>
				}
			/>

			<Page.Content className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Left Column: Information & Recipe */}
				<div className="lg:col-span-2 flex flex-col gap-6">
					<MaterialBasicInfoSection material={material} />
					<MaterialConversionsSection
						conversions={material.conversions}
						baseUomCode={material.uom?.code}
						baseUomId={material.baseUomId}
					/>
					{material.type === 'semi' && (
						<MaterialRecipeSection
							recipe={recipe}
							materialId={id}
							baseUomCode={material.uom?.code}
						/>
					)}
				</div>

				{/* Right Column: Locations & Metadata */}
				<div className="flex flex-col gap-6">
					<MaterialLocationsCard
						locations={locations}
						materialId={id}
						materialName={material.name}
					/>
					<MaterialMetadataCard
						updatedAt={material.updatedAt}
						recordId={material.id}
					/>
				</div>
			</Page.Content>
		</Page>
	)
}

/* -------------------------------------------------------------------------- */
/*  Basic Info Section                                                        */
/* -------------------------------------------------------------------------- */

interface MaterialBasicInfoSectionProps {
	readonly material: MaterialSelectDto
}

function MaterialBasicInfoSection({ material }: MaterialBasicInfoSectionProps) {
	return (
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
	)
}

/* -------------------------------------------------------------------------- */
/*  Conversions Section                                                       */
/* -------------------------------------------------------------------------- */

interface MaterialConversionsSectionProps {
	readonly conversions: ReadonlyArray<MaterialConversionDto>
	readonly baseUomCode: string | undefined
	readonly baseUomId: number
}

function MaterialConversionsSection({
	conversions,
	baseUomCode,
	baseUomId,
}: MaterialConversionsSectionProps) {
	return (
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
						{conversions.map((conv) => (
							<TableRow key={conv.uomId}>
								<TableCell className="font-medium">
									1{' '}
									{conv.uomId === baseUomId
										? baseUomCode
										: (conv.uom?.code ?? `UOM #${conv.uomId}`)}
								</TableCell>
								<TableCell className="text-right font-mono text-xs">
									{toNumber(conv.toBaseFactor)} {baseUomCode}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</CardSection>
	)
}

/* -------------------------------------------------------------------------- */
/*  Recipe Section (Semi-Finished Only)                                       */
/* -------------------------------------------------------------------------- */

interface MaterialRecipeSectionProps {
	readonly recipe: RecipeSelectDto | undefined
	readonly materialId: number
	readonly baseUomCode: string | undefined
}

function MaterialRecipeSection({
	recipe,
	materialId,
	baseUomCode,
}: MaterialRecipeSectionProps) {
	const recipeLink = { to: '/material/$id/recipe' as const, params: { id: String(materialId) } }

	return (
		<CardSection
			title="Detail Resep"
			icon={<ChefHatIcon className="size-4 text-primary" />}
			action={
				<Link
					{...recipeLink}
					className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'h-8')}
				>
					{recipe ? 'Perbarui Resep' : 'Buat Resep'}
				</Link>
			}
		>
			{!recipe ? (
				<EmptyState
					icon={ChefHatIcon}
					title="Belum Ada Resep"
					description="Bahan setengah jadi ini memerlukan resep untuk proses produksinya."
					compact
					action={
						<Link
							{...recipeLink}
							className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
						>
							Buat Resep Sekarang
						</Link>
					}
				/>
			) : (
				<RecipeContent recipe={recipe} baseUomCode={baseUomCode} />
			)}
		</CardSection>
	)
}

/* -------------------------------------------------------------------------- */
/*  Recipe Content (extracted from recipe section)                            */
/* -------------------------------------------------------------------------- */

interface RecipeContentProps {
	readonly recipe: RecipeSelectDto
	readonly baseUomCode: string | undefined
}

function RecipeContent({ recipe, baseUomCode }: RecipeContentProps) {
	return (
		<div className="flex flex-col gap-4">
			{/* Yield & Status Summary */}
			<div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/10">
				<div className="flex flex-col gap-0.5">
					<span className="text-[10px] font-bold text-muted-foreground uppercase">
						Hasil Produksi (Yield)
					</span>
					<span className="text-sm font-bold">
						{toNumber(recipe.targetQty)} {baseUomCode}
					</span>
				</div>
				<div className="flex flex-col items-end gap-0.5">
					<span className="text-[10px] font-bold text-muted-foreground uppercase">
						Status
					</span>
					<BadgeDot {...getActiveStatusBadge(recipe.isActive)} size="xs" />
				</div>
			</div>

			{/* Instructions */}
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

			{/* Ingredient Table */}
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
	)
}

/* -------------------------------------------------------------------------- */
/*  Locations Card (Sidebar)                                                  */
/* -------------------------------------------------------------------------- */

interface MaterialLocationsCardProps {
	readonly locations: ReadonlyArray<MaterialLocationWithLocationDto>
	readonly materialId: number
	readonly materialName: string
}

function MaterialLocationsCard({
	locations,
	materialId,
	materialName,
}: MaterialLocationsCardProps) {
	return (
		<Card size="sm" className="overflow-hidden">
			<div className="p-4 border-b bg-muted/30 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<MapPinIcon className="size-4 text-primary" />
					<h3 className="text-sm font-bold">Lokasi Tersimpan</h3>
				</div>
				<Badge variant="primary-light" size="xs">
					{locations.length}
				</Badge>
			</div>
			<div className="p-2">
				{locations.length === 0 ? (
					<EmptyState
						icon={MapPinIcon}
						title="Belum Ada Lokasi"
						description="Belum di-assign ke lokasi mana pun."
						compact
						action={
							<Button
								variant="outline"
								size="sm"
								className="w-full"
								onClick={() => openAssignDialog(materialId, materialName)}
							>
								Assign Sekarang
							</Button>
						}
					/>
				) : (
					<div className="flex flex-col gap-1">
						{locations.map((loc) => (
							<LocationItem key={loc.id} location={loc} />
						))}
						<div className="mt-2 p-2">
							<Button
								variant="ghost"
								size="sm"
								className="w-full h-8 text-xs text-primary"
								onClick={() => openAssignDialog(materialId, materialName)}
							>
								<PlusIcon className="mr-1 size-3" />
								Kelola Lokasi
							</Button>
						</div>
					</div>
				)}
			</div>
		</Card>
	)
}

/* -------------------------------------------------------------------------- */
/*  Location Item (extracted from locations list)                             */
/* -------------------------------------------------------------------------- */

interface LocationItemProps {
	readonly location: MaterialLocationWithLocationDto
}

function LocationItem({ location: loc }: LocationItemProps) {
	return (
		<div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors border-b last:border-0 group">
			<div className="flex flex-col">
				<span className="text-sm font-medium">{loc.location.name}</span>
				<span className="text-[10px] font-mono text-muted-foreground uppercase">
					{loc.location.code}
				</span>
			</div>
			<Badge variant="outline" size="xs">
				{loc.location.type}
			</Badge>
		</div>
	)
}

/* -------------------------------------------------------------------------- */
/*  Metadata Card (Sidebar)                                                   */
/* -------------------------------------------------------------------------- */

interface MaterialMetadataCardProps {
	readonly updatedAt: string
	readonly recordId: number
}

function MaterialMetadataCard({ updatedAt, recordId }: MaterialMetadataCardProps) {
	return (
		<Card size="sm" className="bg-muted/10 border-dashed">
			<div className="p-4">
				<DataList cols={1}>
					<DataList.Item label="Terakhir Diperbarui">
						{toDateTimeStamp(updatedAt)}
					</DataList.Item>
					<DataList.Item label="ID Sistem (Internal)">
						<span className="font-mono text-muted-foreground">#{recordId}</span>
					</DataList.Item>
				</DataList>
			</div>
		</Card>
	)
}
