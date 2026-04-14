import type { MaterialSelectDto } from '../dto'

import { useMemo } from 'react'

// oxlint-disable no-negated-condition
// oxlint-disable max-lines
import { formOptions, useStore } from '@tanstack/react-form'
import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import type { LinkOptions } from '@tanstack/react-router'

import { generateSku } from '@/lib/sku'
import { toastLabelMessage } from '@/lib/toast-message'
import { toOptions } from '@/lib/utils'

import { CardSection } from '@/components/blocks/card/card-section'
import { FormConfig, useAppForm, useTypedAppFormContext } from '@/components/form'
import { Page } from '@/components/layout/page'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Table } from '@/components/ui/table'

import { materialApi, materialCategoryApi, uomApi } from '../api'
import { MaterialTypeDto } from '../dto'

import { AlertTriangleIcon, PlusIcon, Trash2Icon, Wand2Icon } from 'lucide-react'
import { toast } from 'sonner'
import z from 'zod'

const FormDto = z.object({
	name: z.string().min(1, 'Nama bahan baku harus diisi'),
	description: z.string().optional(),
	sku: z.string().min(1, 'SKU harus diisi'),
	type: MaterialTypeDto,
	categoryId: z.coerce.number<number>().nullable(),
	baseUomId: z.coerce.number<number>().min(1, 'Satuan dasar harus dipilih'),
	conversions: z.array(
		z.object({
			uomId: z.coerce.number<number>().min(1, 'Satuan harus dipilih'),
			toBaseFactor: z.coerce.string<string>(),
		}),
	),
})

type FormDto = z.infer<typeof FormDto>

const fopts = formOptions({ validators: { onSubmit: FormDto }, defaultValues: {} as FormDto })

function getDefaultValues(v?: MaterialSelectDto): FormDto {
	const conversions: FormDto['conversions'] = []

	if (v?.conversions.length) {
		const [_, ...others] = v.conversions
		conversions.push(...others.map((i) => ({ uomId: i.uomId, toBaseFactor: i.toBaseFactor })))
	}
	return {
		name: v?.name ?? '',
		description: v?.description ?? '',
		sku: v?.sku ?? '',
		type: v?.type ?? 'raw',
		categoryId: v?.categoryId ?? null,
		baseUomId: v?.baseUomId ?? null!,
		conversions:
			v?.conversions.map((c) => ({ uomId: c.uomId, toBaseFactor: c.toBaseFactor })) ?? [],
	}
}

interface MaterialFormPageProps {
	mode: 'create' | 'update'
	id?: number
	backTo?: LinkOptions
}

export function MaterialFormPage({ mode, id, backTo }: MaterialFormPageProps) {
	const navigate = useNavigate()
	const selectedMaterial = useQuery({ ...materialApi.detail.query({ id: id! }), enabled: !!id })

	const create = useMutation({ mutationFn: materialApi.create.mutationFn })
	const update = useMutation({ mutationFn: materialApi.update.mutationFn })

	const form = useAppForm({
		...fopts,
		defaultValues: getDefaultValues(selectedMaterial.data?.data),
		onSubmit: async ({ value }) => {
			// Add base UOM conversion (1:1) to the payload sent to server
			const conversions = [
				{ uomId: Number(value.baseUomId), toBaseFactor: '1' },
				...value.conversions.map((c) => ({
					uomId: Number(c.uomId),
					toBaseFactor: String(c.toBaseFactor),
				})),
			]

			const payload = {
				name: value.name,
				description: value.description ?? null,
				sku: value.sku,
				type: value.type,
				baseUomId: Number(value.baseUomId),
				categoryId: value.categoryId ? Number(value.categoryId) : null,
				conversions,
			}

			const promise = selectedMaterial.data?.data
				? update.mutateAsync({ body: { id: selectedMaterial.data.data.id, ...payload } })
				: create.mutateAsync({ body: payload })

			await toast.promise(promise, toastLabelMessage(mode, 'bahan baku')).unwrap()

			if (backTo) {
				navigate({ ...backTo, replace: true })
			}
		},
	})

	return (
		<form.AppForm>
			<FormConfig mode={mode} id={id} backTo={backTo}>
				<Page size="md">
					<Page.BlockHeader
						title={mode === 'create' ? 'Tambah Bahan Baku' : 'Edit Bahan Baku'}
						back={backTo}
					/>
					<form.Form>
						<Page.Content className="gap-6 flex flex-col">
							<GeneralInformationCard />
							<UomInformationSection />
							<UomConversionsSection />
							<form.SimpleActions />
						</Page.Content>
					</form.Form>
				</Page>
			</FormConfig>
		</form.AppForm>
	)
}

function GeneralInformationCard() {
	const form = useTypedAppFormContext({ ...fopts })
	const { data: categories } = useSuspenseQuery({
		...materialCategoryApi.list.query({ page: 1, limit: 100 }),
		select: ({ data }) =>
			toOptions(
				data,
				(i) => String(i.id),
				(i) => i.name,
			),
	})

	return (
		<CardSection title="Informasi Bahan Baku">
			<form.AppField name="name">
				{(field) => (
					<field.Base label="Nama Bahan Baku" required>
						<field.Input placeholder="Contoh: Gula, Garam" />
					</field.Base>
				)}
			</form.AppField>
			<form.AppField name="sku">
				{(field) => (
					<field.Base label="SKU" required>
						<div className="flex items-center gap-2">
							<field.Input placeholder="Contoh: SKU-001" />
							<Button
								variant="outline"
								size="icon"
								type="button"
								className="shrink-0"
								title="Generate SKU otomatis"
								onClick={() => {
									const name = form.getFieldValue('name')
									field.setValue(generateSku('MAT', name))
								}}
							>
								<Wand2Icon className="size-4" />
							</Button>
						</div>
					</field.Base>
				)}
			</form.AppField>
			<form.AppField name="description">
				{(field) => (
					<field.Base label="Deskripsi">
						<field.Textarea placeholder="Masukkan deskripsi bahan baku" />
					</field.Base>
				)}
			</form.AppField>
			<Separator />
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<form.AppField name="categoryId">
					{(field) => (
						<field.Base label="Kategori">
							<field.Select placeholder="Pilih kategori" options={categories} />
						</field.Base>
					)}
				</form.AppField>
				<form.AppField name="type">
					{(field) => (
						<field.Base label="Jenis Bahan Baku" required>
							<field.Select
								placeholder="Pilih jenis bahan baku"
								options={[
									{ label: 'Bahan Mentah', value: 'raw' },
									{ label: 'Bahan Setengah Jadi', value: 'semi' },
								]}
							/>
						</field.Base>
					)}
				</form.AppField>
			</div>
		</CardSection>
	)
}

function UomInformationSection() {
	const form = useTypedAppFormContext({ ...fopts })
	const { data: uoms } = useSuspenseQuery({
		...uomApi.list.query({ page: 1, limit: 100 }),
		select: ({ data }) =>
			toOptions(
				data,
				(i) => i.id,
				(i) => i.code,
			),
	})

	return (
		<Card size="sm">
			<Card.Header className="border-b">
				<Card.Title>Satuan Dasar</Card.Title>
				<Card.Description>
					Satuan terkecil yang digunakan untuk mengukur bahan baku ini
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<form.AppField name="baseUomId">
					{(field) => (
						<field.Base label="Satuan Utama" required>
							<field.Select placeholder="Pilih satuan utama" options={uoms} />
						</field.Base>
					)}
				</form.AppField>
			</Card.Content>
		</Card>
	)
}

function UomConversionsSection() {
	const form = useTypedAppFormContext({ ...fopts })
	const baseUomIdValue = useStore(form.store, (s) => s.values.baseUomId)

	const { data: uoms } = useSuspenseQuery({
		...uomApi.list.query({ page: 1, limit: 100 }),
		select: ({ data }) =>
			toOptions(
				data,
				(i) => i.id,
				(i) => i.code,
			),
	})

	const baseUom = useMemo(() => {
		return uoms.find((u) => u.value === baseUomIdValue)
	}, [baseUomIdValue, uoms])

	return (
		<Card size="sm">
			<Card.Header className="border-b">
				<Card.Title>Konversi Satuan</Card.Title>
				<Card.Description>
					Tambahkan konversi satuan lain yang terkait dengan satuan dasar
				</Card.Description>
			</Card.Header>
			<Card.Content className="flex flex-col gap-4">
				{!baseUomIdValue ? (
					<ConversionAlertBaseUomNotSet />
				) : (
					<>
						<div className="border rounded-md overflow-hidden">
							<Table className="table-fixed">
								<Table.Header className="bg-muted">
									<Table.Row>
										<Table.Head className="w-full">Satuan Konversi</Table.Head>
										<Table.Head className="w-20 text-center">Aksi</Table.Head>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{/* Default Row (1x = 1x) */}
									<Table.Row className="bg-muted/30">
										<Table.Cell>
											<div className="flex items-center gap-2 opacity-80">
												<div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted text-xs font-semibold">
													1
												</div>
												<div className="flex-1 max-w-[200px]">
													<div className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
														{baseUom?.label ?? 'Satuan Dasar'}
													</div>
												</div>
												<div className="text-muted-foreground text-sm font-bold px-1">=</div>
												<div className="flex-1 max-w-[200px]">
													<div className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground font-mono">
														1
													</div>
												</div>
												<div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted text-xs font-semibold px-2 w-auto min-w-8">
													{baseUom?.label ?? '-'}
												</div>
											</div>
										</Table.Cell>
										<Table.Cell className="text-center">
											<Button variant="ghost" size="icon" disabled className="opacity-30">
												<Trash2Icon className="size-4" />
											</Button>
										</Table.Cell>
									</Table.Row>

									<form.AppField name="conversions" mode="array">
										{(arrayField) => {
											return arrayField.state.value.map((_, i) => {
												return (
													// eslint-disable-next-line @eslint-react/no-array-index-key
													<Table.Row key={i}>
														<Table.Cell>
															<div className="flex items-center gap-2">
																<div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted text-xs font-semibold">
																	1
																</div>
																<div className="flex-1 max-w-[200px]">
																	<form.AppField name={`conversions[${i}].uomId`}>
																		{(field) => (
																			<field.Select
																				required
																				placeholder="Pilih satuan..."
																				options={uoms}
																			/>
																		)}
																	</form.AppField>
																</div>
																<div className="text-muted-foreground text-sm font-bold px-1">
																	=
																</div>
																<div className="flex-1 max-w-[200px]">
																	<form.AppField name={`conversions[${i}].toBaseFactor`}>
																		{(field) => (
																			<field.Number
																				required
																				placeholder="Faktor"
																				decimalScale={10}
																			/>
																		)}
																	</form.AppField>
																</div>
																<div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted text-xs font-semibold px-2 w-auto min-w-8">
																	{baseUom?.label ?? '-'}
																</div>
															</div>
														</Table.Cell>
														<Table.Cell className="text-center">
															<Button
																variant="ghost"
																size="icon"
																type="button"
																className="text-destructive hover:bg-destructive/10"
																onClick={() => arrayField.removeValue(i)}
															>
																<Trash2Icon className="size-4" />
															</Button>
														</Table.Cell>
													</Table.Row>
												)
											})
										}}
									</form.AppField>
								</Table.Body>
							</Table>
						</div>
						<Button
							variant="outline"
							size="sm"
							type="button"
							className="w-fit"
							onClick={() => {
								form.pushFieldValue('conversions', { uomId: null!, toBaseFactor: '' })
							}}
						>
							<PlusIcon className="mr-2 size-4" />
							Tambah Konversi Satuan
						</Button>
					</>
				)}
			</Card.Content>
		</Card>
	)
}

function ConversionAlertBaseUomNotSet() {
	return (
		<div className="flex flex-col items-center justify-center gap-3 text-muted-foreground bg-muted/30 rounded-lg border border-dashed py-12">
			<div className="size-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
				<AlertTriangleIcon className="size-6 text-yellow-600 dark:text-yellow-500" />
			</div>
			<div className="text-center space-y-1">
				<p className="font-semibold text-foreground">Satuan Dasar Belum Dipilih</p>
				<p className="text-sm max-w-[280px]">
					Silakan pilih satuan dasar pada bagian di atas terlebih dahulu untuk menambahkan konversi.
				</p>
			</div>
		</div>
	)
}
