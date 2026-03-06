import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { PencilIcon } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import type { UomDto } from '@/features/material'
import { uomApi } from '@/features/material'
import { Page } from '@/components/layout/page'
import { UomFormDialog } from '@/features/material/components/uom-form-dialog'
import { toDateTimeStamp } from '@/lib/formatter'
import { Button } from '@/components/ui/button'
import { useDataTableState } from '@/hooks/use-data-table-state'
import { useDataTable } from '@/hooks/use-data-table'
import { DataTableCard } from '@/components/card/data-table-card'

export const Route = createFileRoute('/_app/materials/uom')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <Page>
      <Page.BlockHeader title='Satuan Bahan Baku' />
      <Page.Content>
        <UomFormDialog.Root />
        <UomTable />
      </Page.Content>
    </Page>
  )
}

const ch = createColumnHelper<UomDto>()

const columns = [
  ch.accessor('code', {
    header: 'Kategori',
    cell: ({ row }) => row.original.code,
    enableSorting: false,
  }),
  ch.accessor('createdAt', {
    header: 'Dibuat Pada',
    cell: ({ row }) => toDateTimeStamp(row.original.createdAt),
    enableSorting: false,
  }),
  ch.display({
    id: 'action',
    header: '',
    cell: ({ row }) => {
      return (
        <div className='flex items-center justify-center'>
          <Button
            variant='ghost'
            size='icon-sm'
            onClick={() => UomFormDialog.upsert({ id: row.original.id })}
          >
            <PencilIcon />
          </Button>
        </div>
      )
    },
    size: 60,
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
  }),
]

function UomTable() {
  const ds = useDataTableState()
  const { data, isLoading } = useQuery(
    uomApi.list.query({
      ...ds.pagination,
    })
  )

  const table = useDataTable({
    columns: columns,
    data: data?.data ?? [],
    pageCount: data?.meta.totalPages ?? 0,
    rowCount: data?.meta.total ?? 0,
    ds,
  })

  return (
    <DataTableCard
      title='Satuan Bahan Baku'
      table={table}
      isLoading={isLoading}
      recordCount={data?.meta.total || 0}
      action={
        <Button size='sm' onClick={() => UomFormDialog.upsert({})}>
          Tambah Satuan
        </Button>
      }
    />
  )
}
