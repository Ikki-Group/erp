import { formOptions } from '@tanstack/react-form'

import { Trash2Icon, WindIcon } from 'lucide-react'
import { createCallable } from 'react-call'
import { z } from 'zod'

import { generateSku } from '@/lib/sku'

import { useAppForm } from '@/components/form'
import { FormDialog } from '@/components/layout/form-dialog'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'

const VariantDto = z.object({
	id: z.number(),
	name: z.string().min(1, 'Nama varian wajib diisi'),
	sku: z.string(),
})

const FormSchema = z
	.object({
		variants: z.array(VariantDto),
	})
	.superRefine((value, ctx) => {
		const seenNames = new Map<string, number>()
		const seenSkus = new Map<string, number>()

		value.variants.forEach((variant, index) => {
			const normalizedName = variant.name.trim().toLowerCase()
			if (normalizedName) {
				const firstIndex = seenNames.get(normalizedName)
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
				} else {
					seenNames.set(normalizedName, index)
				}
			}

			const normalizedSku = variant.sku.trim().toLowerCase()
			if (normalizedSku) {
				const firstIndex = seenSkus.get(normalizedSku)
				if (firstIndex !== undefined) {
					ctx.addIssue({
						code: 'custom',
						path: ['variants', index, 'sku'],
						message: 'SKU varian harus unik',
					})
					ctx.addIssue({
						code: 'custom',
						path: ['variants', firstIndex, 'sku'],
						message: 'SKU varian harus unik',
					})
				} else {
					seenSkus.set(normalizedSku, index)
				}
			}
		})
	})

export type ProductVariantManagementDialogValues = z.infer<typeof FormSchema>

const fopts = formOptions({
	validators: { onSubmit: FormSchema },
	defaultValues: { variants: [] } as ProductVariantManagementDialogValues,
})

interface ProductVariantManagementDialogProps {
	defaultValues: ProductVariantManagementDialogValues
	productName: string
	onSave: (values: ProductVariantManagementDialogValues) => Promise<void> | void
}

export const ProductVariantManagementDialog = createCallable<ProductVariantManagementDialogProps>(
	(props) => {
		const { call, defaultValues, productName } = props

		const form = useAppForm({
			...fopts,
			defaultValues,
			onSubmit: async ({ value }) => {
				await props.onSave(value)
				call.end()
			},
		})

		return (
			<form.AppForm>
				<FormDialog
					title="Kelola varian"
					description="Kelola nama dan SKU varian dalam tabel. Nama dan SKU harus unik."
					open={!call.ended}
					onOpenChange={(open) => !open && call.end()}
					onSubmit={() => form.handleSubmit()}
					footer={<form.DialogActions onCancel={call.end} />}
					className="md:min-w-4xl"
				>
					<div className="flex items-center justify-between gap-3">
						<p className="text-sm text-muted-foreground">
							Tambahkan baris varian lalu isi nama dan SKU. Gunakan generate untuk mengisi SKU
							cepat.
						</p>
						<Button
							type="button"
							variant="outline"
							onClick={() => {
								form.pushFieldValue('variants', {
									id: Number(Date.now()),
									name: '',
									sku: '',
								})
							}}
						>
							Tambah Varian
						</Button>
					</div>
					<form.AppField name="variants" mode="array">
						{(arrayField) => {
							return (
								<ScrollArea className="relative h-64 overflow-y-auto rounded-xl border">
									<Table>
										<TableHeader className="sticky top-0 bg-muted/80 backdrop-blur">
											<TableRow>
												<TableHead className="pl-4">Nama varian</TableHead>
												<TableHead className="pl-4">SKU</TableHead>
												<TableHead className="w-[12rem] pl-4">Generate SKU</TableHead>
												<TableHead className="w-24 pr-4 text-right">Aksi</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{arrayField.state.value.length === 0 ? (
												<TableRow>
													<TableCell
														colSpan={4}
														className="py-8 text-center text-sm text-muted-foreground"
													>
														Belum ada varian. Tambahkan satu baris untuk mulai.
													</TableCell>
												</TableRow>
											) : (
												arrayField.state.value.map((variant, index) => {
													return (
														<TableRow key={variant.id}>
															<TableCell className="pl-4 align-top">
																<form.AppField name={`variants[${index}].name`}>
																	{(field) => (
																		<field.Input
																			placeholder="Default"
																			className="border-0 px-0 shadow-none"
																		/>
																	)}
																</form.AppField>
															</TableCell>

															<TableCell className="pl-4 align-top">
																<form.AppField name={`variants[${index}].sku`}>
																	{(field) => (
																		<field.Input
																			placeholder="Opsional"
																			className="border-0 px-0 shadow-none"
																		/>
																	)}
																</form.AppField>
															</TableCell>

															<TableCell className="pl-4 align-top">
																<Button
																	type="button"
																	variant="outline"
																	size="icon-sm"
																	onClick={() => {
																		const name = form.getFieldValue(`variants[${index}].name`)
																		form.setFieldValue(
																			`variants[${index}].sku`,
																			generateSku('PRD', name || productName),
																		)
																	}}
																>
																	<WindIcon />
																</Button>
															</TableCell>
															<TableCell className="pr-4 text-right align-top">
																<Button
																	type="button"
																	variant="destructive"
																	size="icon-sm"
																	onClick={() => arrayField.removeValue(index)}
																>
																	<Trash2Icon />
																</Button>
															</TableCell>
														</TableRow>
													)
												})
											)}
										</TableBody>
									</Table>
								</ScrollArea>
							)
						}}
					</form.AppField>
				</FormDialog>
			</form.AppForm>
		)
	},
	200,
)
