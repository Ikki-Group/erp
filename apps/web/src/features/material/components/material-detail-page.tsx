import { useSuspenseQueries } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { ChefHatIcon, EditIcon, InfoIcon, MapPinIcon, PlusIcon, ScaleIcon } from 'lucide-react'

import { toDateTimeStamp, toNumber } from '@/lib/formatter'
import { cn } from '@/lib/utils'

import { CardSection } from '@/components/blocks/card/card-section'
import { BadgeDot, getActiveStatusBadge } from '@/components/blocks/data-display/badge-dot'
import { DataList } from '@/components/blocks/data-display/data-list'
import { EmptyState } from '@/components/blocks/feedback/empty-state'
import { Page } from '@/components/layout/page'
import { Badge } from '@/components/reui/badge'

import { Button, buttonVariants } from '@/components/ui/button'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'

import { recipeApi } from '@/features/recipe'
import type { RecipeSelectDto } from '@/features/recipe'

import { materialApi, materialLocationApi } from '../api'
import type { MaterialConversionDto, MaterialSelectDto } from '../dto'
import type { MaterialLocationWithLocationDto } from '../dto'
import { MaterialBadgeProps } from '../utils'
import { MaterialAssignToLocationDialog } from './material-assign-to-location-dialog'

interface MaterialDetailPageProps {
	readonly id: number
}

function openAssignDialog(materialId: number, materialName: string) {
	MaterialAssignToLocationDialog.call({
		materialIds: [materialId],
		materialName,
	})
}

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
			<MaterialAssignToLocationDialog.Root />
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
					<MaterialMetadataCard updatedAt={material.updatedAt} recordId={material.id} />
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
				<DataList.Item label="SKU" value={<span className="font-mono">{material.sku}</span>} />
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

function MaterialRecipeSection({ recipe, materialId, baseUomCode }: MaterialRecipeSectionProps) {
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
					<span className="text-[10px] font-bold text-muted-foreground uppercase">Status</span>
					<BadgeDot {...getActiveStatusBadge(recipe.isActive)} size="xs" />
				</div>
			</div>

			{/* Instructions */}
			{recipe.instructions && (
				<div className="p-3 bg-muted/30 rounded-lg border">
					<span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
						Instruksi
					</span>
					<p className="text-xs whitespace-pre-line leading-relaxed">{recipe.instructions}</p>
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
		<CardSection
			title="Lokasi Tersimpan"
			icon={<MapPinIcon className="size-4 text-primary" />}
			description={`${locations.length} lokasi untuk bahan baku ini`}
			action={
				<Button
					variant="outline"
					size="sm"
					className="h-8"
					onClick={() => openAssignDialog(materialId, materialName)}
				>
					<PlusIcon className="mr-2 size-3.5" />
					Kelola Lokasi
				</Button>
			}
		>
			<div className="border rounded-lg overflow-hidden divide-y">
				{locations.length === 0 ? (
					<div className="p-8 text-center bg-muted/20">
						<p className="text-sm text-muted-foreground">Belum ada lokasi yang ditugaskan.</p>
						<Button
							variant="link"
							size="sm"
							className="mt-1"
							onClick={() => openAssignDialog(materialId, materialName)}
						>
							Tugaskan Sekarang
						</Button>
					</div>
				) : (
					locations.map((loc) => <LocationItem key={loc.id} location={loc} />)
				)}
			</div>
		</CardSection>
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
		<div className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
			<div className="flex items-center gap-3">
				<div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
					{loc.location.name.charAt(0)}
				</div>
				<div className="flex flex-col">
					<span className="text-sm font-semibold">{loc.location.name}</span>
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<span className="font-mono">{loc.location.code}</span>
					</div>
				</div>
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
	readonly updatedAt: Date | string
	readonly recordId: number
}

function MaterialMetadataCard({ updatedAt, recordId }: MaterialMetadataCardProps) {
	return (
		<CardSection title="Audit" icon={<InfoIcon className="size-4 text-primary" />}>
			<div className="space-y-4 pt-2">
				<div className="flex items-start gap-3">
					<InfoIcon className="mt-1 size-4 text-muted-foreground shrink-0" />
					<div className="flex flex-col gap-1">
						<span className="text-xs font-semibold text-muted-foreground uppercase">
							Terakhir Diperbarui
						</span>
						<span className="text-sm">{toDateTimeStamp(updatedAt)}</span>
					</div>
				</div>

				<div className="border-t border-dashed" />

				<div className="flex flex-col gap-1.5 p-3 rounded-md bg-muted/30 border border-dashed">
					<span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
						System Identifiers
					</span>
					<div className="flex justify-between items-center text-xs">
						<span className="text-muted-foreground">Record ID</span>
						<span className="font-mono">#{recordId}</span>
					</div>
				</div>
			</div>
		</CardSection>
	)
}
