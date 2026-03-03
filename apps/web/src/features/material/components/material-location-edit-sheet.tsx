import { formOptions } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import z from 'zod'
import { materialLocationApi } from '../api'
import type { MaterialLocationStockDto } from '../dto'
import { useAppForm } from '@/components/form'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { toastLabelMessage } from '@/lib/toast-message'

/* ─────────── Config Form ─────────── */

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

/* ─────────── Stock Form ─────────── */

const StockDto = z.object({
  stockAdjustment: z.coerce.number<number>(),
  stockSell: z.coerce.number<number>(),
  stockPurchase: z.coerce.number<number>(),
})

type StockDto = z.infer<typeof StockDto>

const stockFopts = formOptions({
  validators: { onSubmit: StockDto },
  defaultValues: {} as StockDto,
})

/* ─────────── Types ─────────── */

type EditMode = 'config' | 'stock'

interface MaterialLocationEditSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: EditMode
  data: MaterialLocationStockDto | null
}

export function MaterialLocationEditSheet({
  open,
  onOpenChange,
  mode,
  data,
}: MaterialLocationEditSheetProps) {
  if (!data) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='sm:max-w-md'>
        {mode === 'config' ? (
          <ConfigForm data={data} onClose={() => onOpenChange(false)} />
        ) : (
          <StockForm data={data} onClose={() => onOpenChange(false)} />
        )}
      </SheetContent>
    </Sheet>
  )
}

/* ─────────── Config Form Component ─────────── */

function ConfigForm({
  data,
  onClose,
}: {
  data: MaterialLocationStockDto
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const updateConfig = useMutation({
    mutationFn: materialLocationApi.updateConfig.mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: materialLocationApi.stock.queryKey(undefined),
      })
    },
  })

  const form = useAppForm({
    ...configFopts,
    defaultValues: {
      minStock: data.minStock,
      maxStock: data.maxStock,
      reorderPoint: data.reorderPoint,
    },
    onSubmit: async ({ value }) => {
      const promise = updateConfig.mutateAsync({
        body: {
          id: data.id,
          ...value,
        },
      })

      await toast
        .promise(promise, toastLabelMessage('update', 'konfigurasi stok'))
        .unwrap()

      onClose()
    },
  })

  return (
    <form.AppForm>
      <SheetHeader className='border-b'>
        <SheetTitle>Konfigurasi Stok</SheetTitle>
        <SheetDescription>
          Atur konfigurasi stok untuk{' '}
          <span className='font-medium text-foreground'>
            {data.materialName}
          </span>
        </SheetDescription>
      </SheetHeader>
      <form.Form className='flex flex-col gap-4 p-4 flex-1'>
        <form.AppField name='minStock'>
          {field => (
            <field.Base label='Stok Minimum' required>
              <field.Input type='number' placeholder='0' />
            </field.Base>
          )}
        </form.AppField>
        <form.AppField name='maxStock'>
          {field => (
            <field.Base label='Stok Maksimum'>
              <field.Input type='number' placeholder='Tidak terbatas' />
            </field.Base>
          )}
        </form.AppField>
        <form.AppField name='reorderPoint'>
          {field => (
            <field.Base label='Reorder Point' required>
              <field.Input type='number' placeholder='0' />
            </field.Base>
          )}
        </form.AppField>
      </form.Form>
      <SheetFooter className='border-t p-4'>
        <Button variant='outline' type='button' onClick={onClose}>
          Batal
        </Button>
        <Button
          type='button'
          disabled={updateConfig.isPending}
          onClick={() => form.handleSubmit()}
        >
          {updateConfig.isPending ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </SheetFooter>
    </form.AppForm>
  )
}

/* ─────────── Stock Form Component ─────────── */

function StockForm({
  data,
  onClose,
}: {
  data: MaterialLocationStockDto
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const updateStock = useMutation({
    mutationFn: materialLocationApi.updateStock.mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: materialLocationApi.stock.queryKey(undefined),
      })
    },
  })

  const form = useAppForm({
    ...stockFopts,
    defaultValues: {
      stockAdjustment: data.stockAdjustment,
      stockSell: data.stockSell,
      stockPurchase: data.stockPurchase,
    },
    onSubmit: async ({ value }) => {
      const promise = updateStock.mutateAsync({
        body: {
          id: data.id,
          ...value,
        },
      })

      await toast
        .promise(promise, toastLabelMessage('update', 'data stok'))
        .unwrap()

      onClose()
    },
  })

  return (
    <form.AppForm>
      <SheetHeader className='border-b'>
        <SheetTitle>Update Stok</SheetTitle>
        <SheetDescription>
          Perbarui data stok untuk{' '}
          <span className='font-medium text-foreground'>
            {data.materialName}
          </span>
        </SheetDescription>
      </SheetHeader>

      {/* Current stock summary */}
      <div className='p-4 space-y-2'>
        <p className='text-sm font-medium text-muted-foreground'>
          Ringkasan Stok Saat Ini
        </p>
        <div className='grid grid-cols-2 gap-2'>
          <div className='rounded-md border p-2.5'>
            <p className='text-xs text-muted-foreground'>Stok Awal</p>
            <p className='text-sm font-semibold'>
              {data.stockStart} {data.baseUom}
            </p>
          </div>
          <div className='rounded-md border p-2.5'>
            <p className='text-xs text-muted-foreground'>Stok Akhir</p>
            <p className='text-sm font-semibold'>
              {data.stockEnd} {data.baseUom}
            </p>
          </div>
        </div>
        <Separator />
      </div>

      <form.Form className='flex flex-col gap-4 px-4 flex-1'>
        <form.AppField name='stockAdjustment'>
          {field => (
            <field.Base label='Adjustment'>
              <field.Input type='number' placeholder='0' />
            </field.Base>
          )}
        </form.AppField>
        <form.AppField name='stockSell'>
          {field => (
            <field.Base label='Penjualan'>
              <field.Input type='number' placeholder='0' />
            </field.Base>
          )}
        </form.AppField>
        <form.AppField name='stockPurchase'>
          {field => (
            <field.Base label='Pembelian'>
              <field.Input type='number' placeholder='0' />
            </field.Base>
          )}
        </form.AppField>
      </form.Form>
      <SheetFooter className='border-t p-4'>
        <Button variant='outline' type='button' onClick={onClose}>
          Batal
        </Button>
        <Button
          type='button'
          disabled={updateStock.isPending}
          onClick={() => form.handleSubmit()}
        >
          {updateStock.isPending ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </SheetFooter>
    </form.AppForm>
  )
}
