import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { PlusIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { formOptions } from '@tanstack/react-form'

import { stockTransactionApi } from '@/features/inventory'
import { AdjustmentTransactionDto } from '@/features/inventory/dto'
import { locationApi } from '@/features/location'
import { materialLocationApi } from '@/features/material/api/material-location.api'

import {
  FormConfig,
  useAppForm,
  useTypedAppFormContext,
} from '@/components/form'
import { Page } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { CardSection } from '@/components/card/card-section'
import { toastLabelMessage } from '@/lib/toast-message'

export const Route = createFileRoute('/_app/inventory/transactions/adjustment')(
  {
    component: RouteComponent,
  }
)

const fopts = formOptions({
  validators: { onSubmit: AdjustmentTransactionDto },
  defaultValues: {
    locationId: undefined as any,
    date: new Date(),
    referenceNo: '',
    notes: '',
    items: [{ materialId: undefined as any, qty: 0 }],
  } as unknown as AdjustmentTransactionDto,
})

function RouteComponent() {
  const navigate = useNavigate()

  const submitMut = useMutation({
    mutationFn: stockTransactionApi.adjustment.mutationFn,
  })

  const form = useAppForm({
    ...fopts,
    onSubmit: async ({ value }) => {
      const promise = submitMut.mutateAsync({
        body: value,
      })

      await toast
        .promise(promise, toastLabelMessage('create', 'penyesuaian stok'))
        .unwrap()

      void navigate({ to: '/inventory/transactions' })
    },
  })

  return (
    <form.AppForm>
      <FormConfig mode='create' backTo={{ to: '/inventory/transactions' }}>
        <Page size='sm'>
          <Page.BlockHeader
            title='Adjustment Stok'
            description='Formulir penyesuaian stok bahan baku (Opname/Koreksi).'
            back={{ to: '/inventory/transactions' }}
          />
          <form.Form>
            <Page.Content className='flex flex-col gap-6 max-w-4xl'>
              <AdjustmentInfoCard />
              <AdjustmentItemsCard />
              <form.SimpleActions />
            </Page.Content>
          </form.Form>
        </Page>
      </FormConfig>
    </form.AppForm>
  )
}

function AdjustmentInfoCard() {
  const form = useTypedAppFormContext({ ...fopts })

  return (
    <CardSection title='Informasi Penyesuaian'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <form.AppField name='locationId'>
          {field => (
            <field.Combobox
              label='Lokasi Gudang'
              required
              placeholder='Pilih lokasi'
              emptyText='Lokasi tidak ditemukan'
              queryKey={['location-list']}
              queryFn={async search => {
                const res = await locationApi.list.fetch({
                  params: {
                    page: 1,
                    limit: 20,
                    search: search || undefined,
                  },
                })
                return res.data
              }}
              getLabel={(loc: any) => `${loc.name} (${loc.code})`}
              getValue={(loc: any) => String(loc.id)}
            />
          )}
        </form.AppField>
        <form.AppField name='date'>
          {field => <field.DatePicker label='Tanggal Penyesuaian' required />}
        </form.AppField>
        <form.AppField name='referenceNo'>
          {field => (
            <field.Base label='No. Referensi' required>
              <field.Input placeholder='ADJ/2026/001' />
            </field.Base>
          )}
        </form.AppField>
        <form.AppField name='notes'>
          {field => (
            <field.Base label='Catatan' className='md:col-span-2'>
              <field.Textarea placeholder='Alasan penyesuaian (misal: stok fisik berbeda)' />
            </field.Base>
          )}
        </form.AppField>
      </div>
    </CardSection>
  )
}

function AdjustmentItemsCard() {
  const form = useTypedAppFormContext({ ...fopts })

  return (
    <CardSection
      title='Bahan Baku'
      description='Masukkan angka kuantitas. Positif (+10) untuk menambah stok, Negatif (-5) untuk mengurangi stok.'
    >
      <div className='flex flex-col gap-4'>
        <form.Subscribe
          selector={s => ({
            items: s.values.items,
            locationId: s.values.locationId,
          })}
        >
          {({ items, locationId }) => (
            <>
              {items.map((item, i) => (
                <div key={item.materialId || i} className='flex gap-3'>
                  <div className='flex-1'>
                    <form.AppField name={`items[${i}].materialId`}>
                      {field => (
                        <field.Combobox
                          label={i === 0 ? 'Pilih Bahan Baku' : undefined}
                          required
                          placeholder='Ketik nama barang...'
                          emptyText='Tidak ditemukan'
                          queryKey={['material-list', String(locationId)]}
                          queryFn={async search => {
                            if (!locationId) return []
                            const res = await materialLocationApi.stock.fetch({
                              params: {
                                locationId: String(locationId),
                                page: 1,
                                limit: 20,
                                search: search || undefined,
                              },
                            })
                            return res.data
                          }}
                          getLabel={(mat: any) =>
                            `${mat.materialName} (${mat.materialSku})`
                          }
                          getValue={(mat: any) => String(mat.materialId)}
                        />
                      )}
                    </form.AppField>
                  </div>

                  <div className='w-48'>
                    <form.AppField name={`items[${i}].qty`}>
                      {field => (
                        <field.Number
                          label={i === 0 ? 'Kuantitas Penyesuaian' : undefined}
                          required
                          description={
                            items[i]?.qty > 0
                              ? 'Akan Menambah Stok'
                              : items[i]?.qty < 0
                                ? 'Akan Mengurangi Stok'
                                : ''
                          }
                        />
                      )}
                    </form.AppField>
                  </div>

                  <div className='w-48'>
                    <form.AppField name={`items[${i}].unitCost`}>
                      {field => (
                        <field.Currency
                          label={i === 0 ? 'HPP Baru (Jika Plus)' : undefined}
                          min={0}
                          placeholder='Otomatis Hitung'
                        />
                      )}
                    </form.AppField>
                  </div>

                  <Button
                    type='button'
                    variant='destructive'
                    size='icon'
                    className={i === 0 ? 'mt-8' : ''}
                    onClick={() => {
                      const curr = [...items]
                      curr.splice(i, 1)
                      form.setFieldValue('items', curr)
                    }}
                    disabled={items.length === 1}
                  >
                    <Trash2Icon className='size-4' />
                  </Button>
                </div>
              ))}

              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  const curr = [...items]
                  curr.push({ materialId: undefined as any, qty: 0 })
                  form.setFieldValue('items', curr)
                }}
              >
                <PlusIcon className='size-4 mr-2' />
                Tambah Baris
              </Button>
            </>
          )}
        </form.Subscribe>
      </div>
    </CardSection>
  )
}
