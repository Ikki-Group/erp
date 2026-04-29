import { useMemo } from 'react'

import { formOptions, useStore } from '@tanstack/react-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import type { LinkOptions } from '@tanstack/react-router'

import { ChefHatIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'
import z from 'zod'

import { toastLabelMessage } from '@/lib/toast-message'

import { CardSection } from '@/components/blocks/card/card-section'
import { FormConfig, useAppForm, useTypedAppFormContext } from '@/components/form'
import { Page } from '@/components/layout/page'

import { Button } from '@/components/ui/button'

import { MaterialPickerDialog, materialApi, uomApi } from '@/features/material'

import type { RecipeSelectDto } from '..'
import { recipeApi } from '..'

const FormDto = z
	.object({
		materialId: z.number().nullable(),
		productId: z.number().nullable(),
		productVariantId: z.number().nullable(),
		targetQty: z.string(),
		isActive: z.boolean(),
		instructions: z.string().nullable(),
		items: z.array(
			z.object({
				materialId: z.number(),
				qty: z.string(),
				scrapPercentage: z.string(),
				uomId: z.number(),
				notes: z.string().optional(),
				sortOrder: z.number(),
			}),
		),
	})
	.refine(
		(data) => {
			const targets = [data.materialId, data.productId, data.productVariantId].filter(
				(t) => t != null,
			)
			return targets.length === 1
		},
		{
			message: 'Recipe must have exactly one target (materialId, productId, or productVariantId)',
			path: ['materialId'],
		},
	)

type FormDto = z.infer<typeof FormDto>

const fopts = formOptions({
	validators: { onSubmit: FormDto },
	defaultValues: {
		materialId: null,
		productId: null,
		productVariantId: null,
		targetQty: '1',
		isActive: true,
		instructions: '',
		items: [],
	} as FormDto,
})

function getDefaultValues(
	v?: RecipeSelectDto,
	target?: {
		materialId?: number | null
		productId?: number | null
		productVariantId?: number | null
	},
): FormDto {
	if (!v) {
		return {
			materialId: target?.materialId ?? null,
			productId: target?.productId ?? null,
			productVariantId: target?.productVariantId ?? null,
			targetQty: '1',
			isActive: true,
			instructions: '',
			items: [],
		}
	}

	return {
		materialId: v.materialId,
		productId: v.productId,
		productVariantId: v.productVariantId,
		targetQty: String(v.targetQty),
		isActive: v.isActive,
		instructions: v.instructions ?? '',
		items: (v.items ?? []).map((item) => ({
			materialId: item.materialId,
			qty: String(item.qty),
			scrapPercentage: String(item.scrapPercentage),
			uomId: item.uomId,
			notes: item.notes ?? '',
			sortOrder: item.sortOrder,
		})),
	}
}

interface RecipeFormPageProps {
	targetId: number
	targetType: 'material' | 'product' | 'productVariant'
	backTo?: LinkOptions
}

export function RecipeFormPage({ targetId, targetType, backTo }: RecipeFormPageProps) {
	const navigate = useNavigate()

	// 1. Load the Target Entity Details (to show header/context)
	const targetMaterial = useQuery({
		...materialApi.detail.query({ id: targetId }),
		enabled: targetType === 'material',
	})

	// 2. Load Existing Recipe for this target
	const existingRecipeQuery = useQuery({
		...recipeApi.list.query({
			[targetType === 'material'
				? 'materialId'
				: targetType === 'product'
					? 'productId'
					: 'productVariantId']: targetId,
		}),
	})

	const existingRecipe = existingRecipeQuery.data?.data?.[0]
	const mode = existingRecipe ? 'update' : 'create'

	const create = useMutation({ mutationFn: recipeApi.create.mutationFn })
	const update = useMutation({ mutationFn: recipeApi.update.mutationFn })

	const form = useAppForm({
		...fopts,
		defaultValues: useMemo(
			() => getDefaultValues(existingRecipe, { [targetType + 'Id']: targetId }),
			[existingRecipe, targetId, targetType],
		),
		onSubmit: async ({ value }) => {
			const promise = existingRecipe
				? update.mutateAsync({ body: { id: existingRecipe.id, ...value } })
				: create.mutateAsync({ body: value })

			await toast.promise(promise, toastLabelMessage(mode, 'resep')).unwrap()

			if (backTo) {
				navigate({ ...backTo, replace: true })
			}
		},
	})

	const targetName = targetType === 'material' ? targetMaterial.data?.data.name : 'Product'

	return (
		<form.AppForm>
			<FormConfig mode={mode} id={existingRecipe?.id} backTo={backTo}>
				<Page size="full">
					<Page.BlockHeader
						title={`${mode === 'create' ? 'Tambah' : 'Edit'} Resep: ${targetName}`}
						back={backTo}
					/>
					<form.Form>
						<Page.Content className="gap-6 flex flex-col pb-20">
							<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
								<div className="lg:col-span-2 space-y-6">
									<RecipeItemsSection />
									<RecipeInstructionsCard />
								</div>
								<div className="space-y-6">
									<RecipeSummaryCard targetName={targetName ?? ''} />
								</div>
							</div>
							<form.SimpleActions />
						</Page.Content>
					</form.Form>
				</Page>
			</FormConfig>
		</form.AppForm>
	)
}

function RecipeSummaryCard({ targetName }: { targetName: string }) {
	const form = useAppFormContext()
	return (
		<CardSection title="Konfigurasi Resep">
			<div className="space-y-4">
				<div className="flex flex-col gap-1 p-3 bg-muted/50 rounded-lg border">
					<span className="text-xs text-muted-foreground font-medium uppercase">
						Target Produksi
					</span>
					<span className="font-semibold">{targetName}</span>
				</div>

				<form.AppField name="targetQty">
					{(field) => (
						<field.Number
							label="Hasil Produksi (Yield)"
							required
							description="Jumlah output yang dihasilkan dari satu resep ini"
							decimalScale={4}
							placeholder="Contoh: 1"
						/>
					)}
				</form.AppField>

				<form.AppField name="isActive">
					{(field) => (
						<field.Switch
							label="Status Resep"
							description="Resep yang tidak aktif tidak akan muncul di modul produksi"
							checked={field.state.value}
							onCheckedChange={field.handleChange}
						/>
					)}
				</form.AppField>
			</div>
		</CardSection>
	)
}

function RecipeInstructionsCard() {
	const form = useAppFormContext()
	return (
		<CardSection title="Instruksi Persiapan">
			<form.AppField name="instructions">
				{(field) => (
					<field.Textarea
						label="Langkah-langkah Persiapan"
						description="Jelaskan proses pembuatan secara detail"
						placeholder="Contoh:
1. Rebus air sampai mendidih.
2. Masukkan bahan A dan aduk perlahan..."
						rows={6}
					/>
				)}
			</form.AppField>
		</CardSection>
	)
}

function RecipeItemsSection() {
	const form = useTypedAppFormContext({ ...fopts })

	const items = useStore(form.store, (s) => s.values.items)

	return (
		<CardSection
			title="Bahan & Komponen"
			description="Daftar bahan yang dibutuhkan untuk resep ini"
			action={
				<MaterialPickerDialog
					selectedIds={items.map((i) => i.materialId).filter(Boolean)}
					onConfirm={(materials) => {
						const currentItems = form.getFieldValue('items')
						const newItems = materials.map((m, idx) => ({
							materialId: m.id,
							qty: '',
							scrapPercentage: '0',
							uomId: m.baseUomId,
							notes: '',
							sortOrder: currentItems.length + idx,
						}))
						form.setFieldValue('items', [...currentItems, ...newItems])
					}}
					trigger={
						<Button variant="outline" size="sm" type="button">
							<PlusIcon className="mr-2" />
							Tambah Bahan
						</Button>
					}
				/>
			}
		>
			<form.AppField name="items" mode="array">
				{(arrayField) => {
					if (arrayField.state.value.length === 0) {
						return (
							<div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
								<ChefHatIcon className="opacity-20" />
								<p className="text-sm">Belum ada bahan baku yang ditambahkan.</p>
								<MaterialPickerDialog
									selectedIds={[] as Array<number>}
									onConfirm={(materials) => {
										const newItems = materials.map((m, idx) => ({
											materialId: m.id,
											qty: '',
											scrapPercentage: '0',
											uomId: m.baseUomId,
											notes: '',
											sortOrder: idx,
										}))
										form.setFieldValue('items', newItems)
									}}
									trigger={
										<Button variant="link" size="sm" type="button">
											Tambah bahan pertama
										</Button>
									}
								/>
							</div>
						)
					}

					return (
						<div className="flex flex-col divide-y">
							{arrayField.state.value.map((_, i) => (
								<RecipeItemRow key={`${i}`} index={i} onRemove={() => arrayField.removeValue(i)} />
							))}
						</div>
					)
				}}
			</form.AppField>
		</CardSection>
	)
}

function RecipeItemRow({ index, onRemove }: { index: number; onRemove: () => void }) {
	const form = useAppFormContext()

	const materialId = useStore(form.store, (s) => s.values.items[index]?.materialId)

	const { data: materialDetail } = useQuery({
		...materialApi.detail.query({ id: Number(materialId) }),
		enabled: !!materialId,
	})

	const { data: allUoms } = useQuery({
		...uomApi.list.query({ page: 1, limit: 100 }),
		enabled: !!materialId,
	})

	const filteredUomOptions = useMemo(() => {
		if (!materialDetail?.data || !allUoms?.data) return []
		const mat = materialDetail.data
		const allowedUomIds = new Set([mat.baseUomId, ...(mat.conversions?.map((c) => c.uomId) || [])])

		return allUoms.data
			.filter((u) => allowedUomIds.has(u.id))
			.map((u) => ({ label: u.code, value: u.id }))
	}, [materialDetail, allUoms])

	return (
		<div className="group flex flex-col gap-3 py-4 px-1">
			<div className="flex items-start justify-between gap-3">
				<div className="flex flex-col gap-0.5 min-w-0 flex-1">
					<span className="font-medium text-sm truncate">
						{materialDetail?.data ? (
							`${materialDetail.data.sku} - ${materialDetail.data.name}`
						) : (
							<span className="text-muted-foreground animate-pulse">Memuat...</span>
						)}
					</span>
					<form.AppField name={`items[${index}].notes`}>
						{(field) => (
							<field.Input
								placeholder="Catatan (pilihan)..."
								className="text-xs text-muted-foreground"
							/>
						)}
					</form.AppField>
				</div>
				<Button
					variant="ghost"
					size="icon-sm"
					type="button"
					className="shrink-0 text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
					onClick={onRemove}
				>
					<Trash2Icon />
				</Button>
			</div>

			<div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
				<form.AppField name={`items[${index}].qty`}>
					{(field) => <field.Number placeholder="Qty" decimalScale={4} />}
				</form.AppField>
				<form.AppField name={`items[${index}].uomId`}>
					{(field) => (
						<field.Select
							placeholder="UOM"
							options={filteredUomOptions}
							disabled={!materialId}
							className="w-24"
						/>
					)}
				</form.AppField>
				<form.AppField name={`items[${index}].scrapPercentage`}>
					{(field) => (
						<div className="flex items-center gap-1">
							<field.Number decimalScale={2} placeholder="0" className="w-20" />
							<span className="text-xs text-muted-foreground">%</span>
						</div>
					)}
				</form.AppField>
			</div>
		</div>
	)
}

function useAppFormContext() {
	return useTypedAppFormContext({ ...fopts })
}
