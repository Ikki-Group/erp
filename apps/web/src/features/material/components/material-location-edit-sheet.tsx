import type { MaterialLocationStockDto } from '../dto'

import { formOptions } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'

import { toast } from 'sonner'
import z from 'zod'

import { toastLabelMessage } from '@/lib/toast-message'

import { useAppForm } from '@/components/form'

import { Button } from '@/components/ui/button'
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet'

import { materialLocationApi } from '../api'

/* ─────────── Config Form Schema ─────────── */

const ConfigDto = z.object({
	minStock: z.coerce.number<number>().min(0),
	maxStock: z.coerce.number<number>().min(0).nullable(),
	reorderPoint: z.coerce.number<number>().min(0),
})

type ConfigDto = z.infer<typeof ConfigDto>

const configFopts = formOptions({
	validators: { onSubmit: ConfigDto },
	defaultValues: {} as ConfigDto,
})

/* ─────────── Types ─────────── */

interface MaterialLocationEditSheetProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	data: MaterialLocationStockDto | null
}

export function MaterialLocationEditSheet({
	open,
	onOpenChange,
	data,
}: MaterialLocationEditSheetProps) {
	if (!data) return null

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="sm:max-w-md">
				<ConfigForm data={data} onClose={() => onOpenChange(false)} />
			</SheetContent>
		</Sheet>
	)
}

/**
 * Renders a configuration form for a material location's stock settings.
 *
 * Presents current stock summary (quantity, average cost, value) and inputs for
 * `minStock`, `maxStock`, and `reorderPoint`. Submitting the form updates the
 * material location's configuration and closes the form.
 */

function ConfigForm({ data, onClose }: { data: MaterialLocationStockDto; onClose: () => void }) {
	const updateConfig = useMutation({
		mutationFn: materialLocationApi.updateConfig.mutationFn,
	})

	const form = useAppForm({
		...configFopts,
		defaultValues: {
			minStock: data.minStock,
			maxStock: data.maxStock,
			reorderPoint: data.reorderPoint,
		},
		onSubmit: async ({ value }) => {
			const promise = updateConfig.mutateAsync({ body: { id: data.id, ...value } })
			await toast.promise(promise, toastLabelMessage('update', 'konfigurasi stok')).unwrap()

			onClose()
		},
	})

	return (
		<form.AppForm>
			<SheetHeader className="border-b">
				<SheetTitle>Konfigurasi Stok</SheetTitle>
				<SheetDescription>
					Atur konfigurasi stok untuk{' '}
					<span className="font-medium text-foreground">{data.materialName}</span>
				</SheetDescription>
			</SheetHeader>

			{/* Current stock summary */}
			<div className="p-4 space-y-2">
				<p className="text-sm font-medium text-muted-foreground">Stok Saat Ini</p>
				<div className="grid grid-cols-3 gap-2">
					<div className="rounded-md border p-2.5">
						<p className="text-xs text-muted-foreground">Kuantitas</p>
						<p className="text-sm font-semibold">
							{data.currentQty} {data.uom?.code ?? '-'}
						</p>
					</div>
					<div className="rounded-md border p-2.5">
						<p className="text-xs text-muted-foreground">Harga Rata-rata</p>
						<p className="text-sm font-semibold">{data.currentAvgCost.toLocaleString('id-ID')}</p>
					</div>
					<div className="rounded-md border p-2.5">
						<p className="text-xs text-muted-foreground">Nilai</p>
						<p className="text-sm font-semibold">{data.currentValue.toLocaleString('id-ID')}</p>
					</div>
				</div>
			</div>

			<form.Form className="flex flex-col gap-4 p-4 flex-1">
				<form.AppField name="minStock">
					{(field) => (
						<field.Base label="Stok Minimum" required>
							<field.Input type="number" placeholder="0" />
						</field.Base>
					)}
				</form.AppField>
				<form.AppField name="maxStock">
					{(field) => (
						<field.Base label="Stok Maksimum">
							<field.Input type="number" placeholder="Tidak terbatas" />
						</field.Base>
					)}
				</form.AppField>
				<form.AppField name="reorderPoint">
					{(field) => (
						<field.Base label="Reorder Point" required>
							<field.Input type="number" placeholder="0" />
						</field.Base>
					)}
				</form.AppField>
			</form.Form>
			<SheetFooter className="border-t p-4">
				<Button variant="outline" type="button" onClick={onClose}>
					Batal
				</Button>
				<Button type="button" disabled={updateConfig.isPending} onClick={() => form.handleSubmit()}>
					{updateConfig.isPending ? 'Menyimpan...' : 'Simpan'}
				</Button>
			</SheetFooter>
		</form.AppForm>
	)
}
