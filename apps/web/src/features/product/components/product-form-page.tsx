import { useEffect } from 'react'
import React from 'react'

import { formOptions, useStore } from '@tanstack/react-form'
import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import type { LinkOptions } from '@tanstack/react-router'

import { PlusCircleIcon, Wand2Icon } from 'lucide-react'
import { toast } from 'sonner'
import z from 'zod'

import { generateSku } from '@/lib/sku'
import { toastLabelMessage } from '@/lib/toast-message'
import { toOptions } from '@/lib/utils'

import { CardSection } from '@/components/blocks/card/card-section'
import { FormConfig, useAppForm, useTypedAppFormContext } from '@/components/form'
import { Page } from '@/components/layout/page'
import { Badge } from '@/components/reui/badge'

import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'

import { productApi, productCategoryApi, salesTypeApi } from '../api'
import type { ProductSelectDto } from '../dto'
import {
	ProductVariantManagementDialog,
	type ProductVariantManagementDialogValues,
} from './product-variant-management-dialog'

const FormDto = z
	.object({
		name: z.string().min(1, 'Nama produk wajib diisi'),
		description: z.string().nullable(),
		sku: z.string().min(1, 'SKU wajib diisi'),
		basePrice: z.number().min(0),
		locationId: z.number(),
		categoryId: z.string().nullable(),
		status: z.enum(['active', 'inactive', 'archived']),
		hasVariants: z.boolean(),
		hasSalesTypePricing: z.boolean(),
		prices: z.array(z.object({ salesTypeId: z.number(), price: z.number().min(0) })),
		variants: z.array(
			z.object({
				_id: z.string(),
				id: z.number().optional(),
				name: z.string().min(1, 'Nama varian wajib diisi'),
				sku: z.string().optional(),
				basePrice: z.number().min(0),
				prices: z.array(z.object({ salesTypeId: z.number(), price: z.number().min(0) })),
			}),
		),
	})
	.superRefine((value, ctx) => {
		if (value.variants.length <= 1) return

		const seen = new Map<string, number>()

		value.variants.forEach((variant, index) => {
			const normalizedName = variant.name.trim().toLowerCase()
			if (!normalizedName) return

			const firstIndex = seen.get(normalizedName)
			if (firstIndex !== undefined) {
				ctx.addIssue({
					code: 'custom',
					path: ['variants', index, 'name'],
					message: 'Nama varian harus unik',
				})
				ctx.addIssue({
					code: 'custom',
					path: ['variants', firstIndex, 'name'],
					message: 'Nama varian harus unik',
				})
				return
			}

			seen.set(normalizedName, index)
		})
	})

type FormDto = z.infer<typeof FormDto>

const fopts = formOptions({ validators: { onSubmit: FormDto }, defaultValues: {} as FormDto })

function getDefaultValues(v?: ProductSelectDto): FormDto {
	return {
		name: v?.name ?? '',
		description: v?.description ?? '',
		sku: v?.sku ?? '',
		basePrice: v?.basePrice ? Number(v.basePrice) : 0,
		locationId: v?.locationId ?? 1,
		categoryId: v?.categoryId != null ? String(v.categoryId) : null,
		status: v?.status ?? 'active',
		hasVariants: v?.hasVariants ?? false,
		hasSalesTypePricing: v?.hasSalesTypePricing ?? false,
		prices: v?.prices.map((p) => ({ salesTypeId: p.salesTypeId, price: Number(p.price) })) ?? [],
		variants:
			v?.variants.map((varnt) => ({
				_id: String(varnt.id),
				id: varnt.id,
				name: varnt.name,
				sku: varnt.sku ?? undefined,
				basePrice: Number(varnt.basePrice),
				prices: varnt.prices.map((p) => ({ salesTypeId: p.salesTypeId, price: Number(p.price) })),
			})) ?? [],
	}
}

function buildVariantDialogDefaultValues(
	variants: FormDto['variants'],
	productSku: string,
): ProductVariantManagementDialogValues {
	if (variants.length <= 1) {
		return {
			variants: [
				{
					id: Number(Date.now()),
					name: 'default',
					sku: productSku,
				},
			],
		}
	}

	return {
		variants: variants.map((variant) => ({
			id: variant.id ?? Number(Date.now()),
			name: variant.name,
			sku: variant.sku ?? '',
		})),
	}
}

function mergeVariantDialogValues(
	values: ProductVariantManagementDialogValues,
	currentVariants: FormDto['variants'],
): FormDto['variants'] {
	const existingById = new Map(
		currentVariants
			.filter((variant) => variant.id != null)
			.map((variant) => [variant.id as number, variant]),
	)

	return values.variants.map((variant, index) => {
		const existing = existingById.get(variant.id)
		const fallback = currentVariants.length === 1 && index === 0 ? currentVariants[0] : undefined
		const source = existing ?? fallback

		return {
			_id: source?._id ?? String(variant.id),
			id: variant.id,
			name: variant.name,
			sku: variant.sku.trim() ? variant.sku.trim() : undefined,
			basePrice: source?.basePrice ?? 0,
			prices: source?.prices ?? [],
		}
	})
}

type SalesTypePriceValue = { salesTypeId: number; price: number }

function syncSalesTypePrices(
	prices: SalesTypePriceValue[],
	salesTypes: Array<{ id: number }>,
): SalesTypePriceValue[] {
	const current = new Map(prices.map((price) => [price.salesTypeId, price.price]))

	return salesTypes.map((salesType) => ({
		salesTypeId: salesType.id,
		price: current.get(salesType.id) ?? 0,
	}))
}

function areSalesTypePricesEqual(current: SalesTypePriceValue[], next: SalesTypePriceValue[]) {
	if (current.length !== next.length) return false

	return current.every((price, index) => {
		const nextPrice = next[index]
		if (!nextPrice) return false
		return price.salesTypeId === nextPrice.salesTypeId && price.price === nextPrice.price
	})
}

function areVariantPriceValuesEqual(current: FormDto['variants'], next: FormDto['variants']) {
	if (current.length !== next.length) return false

	return current.every((variant, index) => {
		const nextVariant = next[index]
		if (!nextVariant) return false

		return (
			variant._id === nextVariant._id &&
			variant.id === nextVariant.id &&
			variant.basePrice === nextVariant.basePrice &&
			areSalesTypePricesEqual(variant.prices, nextVariant.prices)
		)
	})
}

interface ProductFormPageProps {
	mode: 'create' | 'update'
	id?: number
	backTo?: LinkOptions
}

export function ProductFormPage({ mode, id, backTo }: ProductFormPageProps) {
	const navigate = useNavigate()
	const selectedProduct = useQuery({ ...productApi.detail.query({ id: id! }), enabled: !!id })

	const create = useMutation({ mutationFn: productApi.create.mutationFn })
	const update = useMutation({ mutationFn: productApi.update.mutationFn })

	const form = useAppForm({
		...fopts,
		defaultValues: getDefaultValues(selectedProduct.data?.data),
		onSubmit: async ({ value }) => {
			const hasVariantMode = value.variants.length > 1
			const payload = {
				...value,
				basePrice: String(value.basePrice),
				categoryId: value.categoryId ? Number(value.categoryId) : null,
				hasVariants: hasVariantMode,
				hasSalesTypePricing: value.hasSalesTypePricing,
				prices:
					value.hasSalesTypePricing && !hasVariantMode
						? value.prices.map((p) => ({ ...p, price: String(p.price) }))
						: [],
				variants: value.variants.map(({ _id, id: _vId, prices, basePrice, ...v }) => ({
					...v,
					basePrice: String(basePrice),
					prices: value.hasSalesTypePricing
						? prices.map((p) => ({ ...p, price: String(p.price) }))
						: [],
				})),
			}

			const promise = id
				? update.mutateAsync({ body: { id, ...payload } })
				: create.mutateAsync({ body: payload })

			await toast.promise(promise, toastLabelMessage(mode, 'produk')).unwrap()

			if (backTo) {
				navigate({ ...backTo, replace: true })
			} else {
				navigate({ to: '/product', replace: true })
			}
		},
	})

	return (
		<>
			<ProductVariantManagementDialog.Root />
			<form.AppForm>
				<FormConfig mode={mode} id={id} backTo={backTo}>
					<Page size="md">
						<Page.BlockHeader
							title={mode === 'create' ? 'Tambah Produk' : 'Edit Produk'}
							back={backTo ?? { to: '/product' }}
						/>
						<form.Form>
							<Page.Content className="flex flex-col gap-6">
								<ProductInfoCard />
								<PricingAndVariantsSection />
								<form.SimpleActions />
							</Page.Content>
						</form.Form>
					</Page>
				</FormConfig>
			</form.AppForm>
		</>
	)
}

function ProductInfoCard() {
	const form = useTypedAppContext()
	const { data: categories } = useSuspenseQuery({
		...productCategoryApi.list.query({ page: 1, limit: 100 }),
		select: ({ data }) =>
			toOptions(
				data,
				(i) => String(i.id),
				(i) => i.name,
			),
	})

	return (
		<CardSection title="Informasi Dasar" description="Detail utama mengenai produk.">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<form.AppField name="name">
					{(field) => (
						<field.Base label="Nama Produk" required>
							<field.Input placeholder="Misal: Cappuccino Gula Aren" />
						</field.Base>
					)}
				</form.AppField>
				<form.AppField name="sku">
					{(field) => (
						<field.Base label="SKU" required>
							<div className="flex items-center gap-2">
								<field.Input placeholder="SKU-001" />
								<Button
									variant="outline"
									size="icon"
									type="button"
									className="shrink-0"
									title="Generate SKU otomatis"
									onClick={() => {
										const name = form.getFieldValue('name')
										field.setValue(generateSku('PRD', name))
									}}
								>
									<Wand2Icon />
								</Button>
							</div>
						</field.Base>
					)}
				</form.AppField>

				<form.AppField name="categoryId">
					{(field) => (
						<field.Base label="Kategori">
							<field.Select placeholder="Pilih kategori" options={categories} />
						</field.Base>
					)}
				</form.AppField>
				<form.AppField name="status">
					{(field) => (
						<field.Base label="Status" required>
							<field.Select
								placeholder="Pilih status"
								options={[
									{ label: 'Aktif', value: 'active' },
									{ label: 'Non-Aktif', value: 'inactive' },
									{ label: 'Arsip', value: 'archived' },
								]}
							/>
						</field.Base>
					)}
				</form.AppField>

				<form.AppField name="description">
					{(field) => (
						<field.Base label="Deskripsi" className="md:col-span-2">
							<field.Textarea placeholder="Tuliskan deskripsi produk..." />
						</field.Base>
					)}
				</form.AppField>
			</div>
		</CardSection>
	)
}

function PricingAndVariantsSection() {
	const form = useTypedAppContext()
	const hasSalesTypePricing = useStore(form.store, (s) => s.values.hasSalesTypePricing)
	const variants = useStore(form.store, (s) => s.values.variants)

	const { data: salesTypes } = useSuspenseQuery({
		...salesTypeApi.list.query({ page: 1, limit: 100 }),
	})

	const isVariantMode = variants.length > 1

	return (
		<CardSection
			title="Harga & Varian"
			description="Atur harga produk, varian, dan harga per tipe penjualan."
		>
			{/* Toolbar */}
			<div className="flex flex-wrap items-center gap-3">
				<Button
					type="button"
					variant="outline"
					onClick={() => {
						const currentVariants = form.getFieldValue('variants')
						const productSku = form.getFieldValue('sku')
						const productName = form.getFieldValue('name')

						ProductVariantManagementDialog.call({
							defaultValues: buildVariantDialogDefaultValues(currentVariants, productSku),
							productName,
							onSave: (values) => {
								const nextVariants = mergeVariantDialogValues(
									values,
									form.getFieldValue('variants'),
								)
								form.setFieldValue('variants', nextVariants)
								form.setFieldValue('hasVariants', nextVariants.length > 1)
							},
						})
					}}
				>
					<PlusCircleIcon />
					{isVariantMode ? 'Edit varian' : 'Tambah varian'}
				</Button>

				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<Badge variant={isVariantMode ? 'default' : 'secondary'} size="sm">
						{variants.length} varian
					</Badge>
					{isVariantMode && <span>Mode varian aktif</span>}
				</div>
			</div>

			{/* Pricing Table */}
			<div className="mt-4 overflow-hidden rounded-2xl border bg-card shadow-sm">
				{/* Table Header with controls */}
				<div className="border-b px-4 py-3 sm:px-5">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-center gap-3">
							<h3 className="text-sm font-semibold">
								{isVariantMode ? 'Harga per varian' : 'Harga produk'}
							</h3>
							<form.AppField name="hasSalesTypePricing">
								{(field) => (
									<div className="flex items-center gap-2">
										<Switch
											checked={field.state.value}
											onCheckedChange={field.handleChange}
											id="sales-type-toggle"
										/>
										<label htmlFor="sales-type-toggle" className="text-sm text-muted-foreground">
											Harga per sales type
										</label>
									</div>
								)}
							</form.AppField>
						</div>
					</div>
				</div>

				{/* Table Content */}
				<div className="overflow-x-auto">
					{isVariantMode ? (
						<VariantPricingTable
							variants={variants}
							salesTypes={salesTypes.data}
							hasSalesTypePricing={hasSalesTypePricing}
						/>
					) : (
						<SingleProductPricingTable
							salesTypes={salesTypes.data}
							hasSalesTypePricing={hasSalesTypePricing}
						/>
					)}
				</div>
			</div>
		</CardSection>
	)
}

function VariantPricingTable({
	variants,
	salesTypes,
	hasSalesTypePricing,
}: {
	variants: FormDto['variants']
	salesTypes: Array<{ id: number; name: string }>
	hasSalesTypePricing: boolean
}) {
	const form = useTypedAppContext()

	useEffect(() => {
		if (!hasSalesTypePricing) return

		const currentVariants = form.getFieldValue('variants')
		const nextVariants = currentVariants.map((variant) => ({
			...variant,
			prices: syncSalesTypePrices(variant.prices, salesTypes),
		}))

		if (!areVariantPriceValuesEqual(currentVariants, nextVariants)) {
			form.setFieldValue('variants', nextVariants)
		}
	}, [form, hasSalesTypePricing, salesTypes])

	if (variants.length === 0) {
		return (
			<div className="p-8 text-center text-sm text-muted-foreground">
				Belum ada varian. Klik &quot;Tambah varian&quot; untuk memulai.
			</div>
		)
	}

	return (
		<Table>
			<TableHeader className="bg-muted/40">
				<TableRow>
					<TableHead className="w-[50%]">Nama</TableHead>
					<TableHead className="w-[20%]">SKU</TableHead>
					<TableHead className="text-right">Harga</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{variants.map((variant, idx) => (
					<React.Fragment key={variant._id}>
						{/* Variant Row */}
						<TableRow>
							<TableCell className="font-medium">{variant.name}</TableCell>
							<TableCell className="text-muted-foreground">{variant.sku ?? '-'}</TableCell>
							{!hasSalesTypePricing && (
								<TableCell className="text-right">
									<form.AppField name={`variants[${idx}].basePrice`}>
										{(field) => (
											<field.Currency
												className="w-32 border-0 text-right shadow-none"
												placeholder="0"
											/>
										)}
									</form.AppField>
								</TableCell>
							)}
							{hasSalesTypePricing && <TableCell />}
						</TableRow>

						{/* Sales Type Rows (indented) */}
						{hasSalesTypePricing &&
							salesTypes.map((st, stIdx) => (
								<TableRow key={`${variant._id}-${st.id}`}>
									<TableCell className="pl-8 text-muted-foreground">{st.name}</TableCell>
									<TableCell />
									<TableCell className="text-right">
										<form.AppField name={`variants[${idx}].prices[${stIdx}].price`}>
											{(field) => (
												<field.Currency
													className="w-32 border-0 text-right shadow-none"
													placeholder="0"
												/>
											)}
										</form.AppField>
									</TableCell>
								</TableRow>
							))}
					</React.Fragment>
				))}
			</TableBody>
		</Table>
	)
}

function SingleProductPricingTable({
	salesTypes,
	hasSalesTypePricing,
}: {
	salesTypes: Array<{ id: number; name: string }>
	hasSalesTypePricing: boolean
}) {
	const form = useTypedAppContext()

	useEffect(() => {
		if (!hasSalesTypePricing) return

		const currentPrices = form.getFieldValue('prices')
		const nextPrices = syncSalesTypePrices(currentPrices, salesTypes)
		if (!areSalesTypePricesEqual(currentPrices, nextPrices)) {
			form.setFieldValue('prices', nextPrices)
		}
	}, [form, hasSalesTypePricing, salesTypes])

	return (
		<Table>
			<TableHeader className="bg-muted/40">
				<TableRow>
					<TableHead className="w-[60%]">{hasSalesTypePricing ? 'Sales type' : 'Item'}</TableHead>
					<TableHead className="text-right">Harga</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{!hasSalesTypePricing && (
					<TableRow>
						<TableCell className="font-medium">Harga dasar</TableCell>
						<TableCell className="text-right">
							<form.AppField name="basePrice">
								{(field) => (
									<field.Currency
										className="w-32 border-0 text-right shadow-none"
										placeholder="0"
									/>
								)}
							</form.AppField>
						</TableCell>
					</TableRow>
				)}
				{hasSalesTypePricing &&
					salesTypes.map((st, idx) => (
						<TableRow key={st.id}>
							<TableCell className="font-medium">{st.name}</TableCell>
							<TableCell className="text-right">
								<form.AppField name={`prices[${idx}].price`}>
									{(field) => (
										<field.Currency
											className="w-32 border-0 text-right shadow-none"
											placeholder="0"
										/>
									)}
								</form.AppField>
							</TableCell>
						</TableRow>
					))}
			</TableBody>
		</Table>
	)
}

function useTypedAppContext() {
	return useTypedAppFormContext({ ...fopts })
}
