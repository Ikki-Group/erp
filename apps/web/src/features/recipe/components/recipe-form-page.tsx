import { formOptions, useStore } from '@tanstack/react-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { ChefHatIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useMemo } from 'react'
import { toast } from 'sonner'
import type { z } from 'zod'

import type { RecipeSelectDto } from '@/features/recipe'
import type { LinkOptions } from '@tanstack/react-router'
import type { MaterialSelectDto } from '@/features/material'
import { Page } from '@/components/layout/page'
import {
  FormConfig,
  useAppForm,
  useTypedAppFormContext,
} from '@/components/form'
import { CardSection } from '@/components/card/card-section'
import { Card } from '@/components/ui/card'
import { Table } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { toastLabelMessage } from '@/lib/toast-message'

import { materialApi, uomApi } from '@/features/material'
import { RecipeMutationDto, recipeApi } from '@/features/recipe'
import { DataCombobox } from '@/components/ui/data-combobox'

type RecipeMutation = z.infer<typeof RecipeMutationDto>

const fopts = formOptions({
  validators: { onSubmit: RecipeMutationDto as any },
  defaultValues: {
    materialId: null,
    productId: null,
    productVariantId: null,
    targetQty: '1',
    isActive: true,
    instructions: '',
    items: [],
  } as RecipeMutation,
})

function getDefaultValues(
  v?: RecipeSelectDto,
  target?: {
    materialId?: number | null
    productId?: number | null
    productVariantId?: number | null
  }
): RecipeMutation {
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
    targetQty: v.targetQty,
    isActive: v.isActive,
    instructions: v.instructions ?? '',
    items: (v.items || []).map((item: any) => ({
      materialId: item.materialId,
      qty: item.qty,
      scrapPercentage: item.scrapPercentage,
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

export function RecipeFormPage({
  targetId,
  targetType,
  backTo,
}: RecipeFormPageProps) {
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
      [existingRecipe, targetId, targetType]
    ),
    onSubmit: async ({ value }) => {
      const promise = existingRecipe
        ? update.mutateAsync({
            body: {
              id: existingRecipe.id,
              ...(value as any),
            },
          })
        : create.mutateAsync({
            body: value as any,
          })

      await toast.promise(promise, toastLabelMessage(mode, 'resep')).unwrap()

      if (backTo) {
        navigate({ ...(backTo as any), replace: true })
      }
    },
  })

  const targetName =
    targetType === 'material' ? targetMaterial.data?.data.name : 'Product'

  return (
    <form.AppForm>
      <FormConfig mode={mode} id={existingRecipe?.id} backTo={backTo}>
        <Page size='lg'>
          <Page.BlockHeader
            title={`${mode === 'create' ? 'Tambah' : 'Edit'} Resep: ${targetName}`}
            back={backTo}
          />
          <form.Form>
            <Page.Content className='gap-6 flex flex-col pb-20'>
              <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                <div className='lg:col-span-2 space-y-6'>
                  <RecipeItemsSection />
                  <RecipeInstructionsCard />
                </div>
                <div className='space-y-6'>
                  <RecipeSummaryCard targetName={targetName || ''} />
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
    <CardSection title='Konfigurasi Resep'>
      <div className='space-y-4'>
        <div className='flex flex-col gap-1 p-3 bg-muted/50 rounded-lg border'>
          <span className='text-xs text-muted-foreground font-medium uppercase'>
            Target Produksi
          </span>
          <span className='font-semibold'>{targetName}</span>
        </div>

        <form.AppField name='targetQty'>
          {field => (
            <field.Base
              label='Hasil Produksi (Yield)'
              required
              description='Jumlah output yang dihasilkan dari satu resep ini'
            >
              <field.Number decimalScale={4} placeholder='Contoh: 1' />
            </field.Base>
          )}
        </form.AppField>

        <form.AppField name='isActive'>
          {field => (
            <field.Switch
              label='Status Resep'
              description='Resep yang tidak aktif tidak akan muncul di modul produksi'
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
    <CardSection title='Instruksi Persiapan'>
      <form.AppField name='instructions'>
        {field => (
          <field.Base
            label='Langkah-langkah Persiapan'
            description='Jelaskan proses pembuatan secara detail'
          >
            <field.Textarea
              placeholder='Contoh:
1. Rebus air sampai mendidih.
2. Masukkan bahan A dan aduk perlahan...'
              rows={6}
            />
          </field.Base>
        )}
      </form.AppField>
    </CardSection>
  )
}

function RecipeItemsSection() {
  const form = useTypedAppFormContext({ ...fopts })

  return (
    <Card size='sm'>
      <Card.Header className='border-b flex-row items-center justify-between py-4'>
        <div>
          <Card.Title>Bahan & Komponen</Card.Title>
          <Card.Description>
            Daftar bahan yang dibutuhkan untuk resep ini
          </Card.Description>
        </div>
        <Button
          variant='outline'
          size='sm'
          type='button'
          onClick={() => {
            form.pushFieldValue('items', {
              materialId: null as any,
              qty: '',
              scrapPercentage: '0',
              uomId: null as any,
              notes: '',
              sortOrder: form.getFieldValue('items').length,
            })
          }}
        >
          <PlusIcon className='mr-2 size-4' />
          Tambah Bahan
        </Button>
      </Card.Header>
      <Card.Content className='p-0'>
        <Table>
          <Table.Header className='bg-muted/50'>
            <Table.Row>
              <Table.Head className='w-[40%]'>Bahan Baku</Table.Head>
              <Table.Head className='w-[20%]'>Jumlah</Table.Head>
              <Table.Head className='w-[20%] text-center'>
                Wastage (%)
              </Table.Head>
              <Table.Head className='w-[20%] text-right pr-4'>Aksi</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <form.AppField name='items' mode='array'>
              {arrayField => {
                if (arrayField.state.value.length === 0) {
                  return (
                    <Table.Row>
                      <Table.Cell
                        colSpan={4}
                        className='h-32 text-center text-muted-foreground'
                      >
                        <div className='flex flex-col items-center gap-2'>
                          <ChefHatIcon className='size-8 opacity-20' />
                          <p>Belum ada bahan baku yang ditambahkan.</p>
                          <Button
                            variant='link'
                            size='sm'
                            onClick={() =>
                              arrayField.pushValue({
                                materialId: null as any,
                                qty: '',
                                scrapPercentage: '0',
                                uomId: null as any,
                                notes: '',
                                sortOrder: 0,
                              })
                            }
                          >
                            Tambah bahan pertama
                          </Button>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  )
                }

                return arrayField.state.value.map((_, i) => (
                  <RecipeItemRow
                    key={i}
                    index={i}
                    onRemove={() => arrayField.removeValue(i)}
                  />
                ))
              }}
            </form.AppField>
          </Table.Body>
        </Table>
      </Card.Content>
    </Card>
  )
}

function RecipeItemRow({
  index,
  onRemove,
}: {
  index: number
  onRemove: () => void
}) {
  const form = useAppFormContext()

  const materialId = useStore(
    form.store,
    (s: any) => s.values.items[index]?.materialId
  )

  const { data: materialDetail } = useQuery({
    ...materialApi.detail.query({ id: Number(materialId) }),
    enabled: !!materialId,
  })

  const { data: allUoms } = useQuery({
    ...uomApi.list.query({ params: { page: 1, limit: 100 } }),
    enabled: !!materialId,
  })

  const filteredUomOptions = useMemo(() => {
    if (!materialDetail?.data || !allUoms?.data) return []
    const mat = materialDetail.data
    const allowedUomIds = new Set([
      mat.baseUomId,
      ...(mat.conversions?.map((c: any) => c.uomId) || []),
    ])

    return allUoms.data
      .filter((u: any) => allowedUomIds.has(u.id))
      .map((u: any) => ({ label: u.code, value: u.id }))
  }, [materialDetail, allUoms])

  return (
    <Table.Row className='group'>
      <Table.Cell className='align-top pt-4'>
        <form.AppField name={`items[${index}].materialId` as any}>
          {field => (
            <DataCombobox<MaterialSelectDto>
              value={field.state.value ? String(field.state.value) : null}
              onValueChange={val => {
                field.handleChange(val ? Number(val) : (null as any))
                form.setFieldValue(`items[${index}].uomId` as any, null as any)
              }}
              placeholder='Pilih Bahan...'
              queryKey={['materials', 'search']}
              queryFn={async s => {
                const res = await materialApi.list.fetch({
                  params: { search: s, limit: 20 },
                })
                return res.data
              }}
              getLabel={m => `${m.sku} - ${m.name}`}
              getValue={m => String(m.id)}
            />
          )}
        </form.AppField>
        <form.AppField name={`items[${index}].notes` as any}>
          {field => (
            <textarea
              className='mt-2 w-full bg-transparent border-none resize-none text-xs text-muted-foreground focus:ring-0 p-0 ml-1'
              placeholder='Catatan khusus (opsional)...'
              value={field.state.value || ''}
              onChange={e => field.handleChange(e.target.value)}
              rows={1}
            />
          )}
        </form.AppField>
      </Table.Cell>
      <Table.Cell className='align-top pt-4'>
        <div className='flex items-center gap-1'>
          <form.AppField name={`items[${index}].qty` as any}>
            {field => (
              <field.Number
                placeholder='Qty'
                decimalScale={4}
                className='w-full'
              />
            )}
          </form.AppField>
          <div className='w-24'>
            <form.AppField name={`items[${index}].uomId` as any}>
              {field => (
                <field.Select
                  placeholder='UOM'
                  options={filteredUomOptions}
                  disabled={!materialId}
                />
              )}
            </form.AppField>
          </div>
        </div>
      </Table.Cell>
      <Table.Cell className='align-top pt-4 text-center'>
        <form.AppField name={`items[${index}].scrapPercentage` as any}>
          {field => (
            <div className='inline-flex items-center gap-1 max-w-[80px]'>
              <field.Number decimalScale={2} placeholder='0' />
              <span className='text-xs text-muted-foreground'>%</span>
            </div>
          )}
        </form.AppField>
      </Table.Cell>
      <Table.Cell className='align-top pt-4 text-right'>
        <Button
          variant='ghost'
          size='icon'
          type='button'
          className='text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity'
          onClick={onRemove}
        >
          <Trash2Icon className='size-4' />
        </Button>
      </Table.Cell>
    </Table.Row>
  )
}

function useAppFormContext() {
  return useTypedAppFormContext({ ...fopts })
}
