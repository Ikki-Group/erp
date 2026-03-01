import { Link, createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { PencilIcon } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import type { MaterialDto } from '@/features/material'
import { Page } from '@/components/layout/page'
import { toDateTimeStamp } from '@/lib/formatter'
import { Button } from '@/components/ui/button'
import { useDataTableState } from '@/hooks/use-data-table-state'
import { MaterialBadgeProps, materialApi } from '@/features/material'
import { useDataTable } from '@/hooks/use-data-table'
import { DataTableCard } from '@/components/card/data-table-card'
import { BadgeDot } from '@/components/common/badge-dot'

export const Route = createFileRoute('/_app/materials/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <Page>
      <Page.BlockHeader title='Bahan Baku' />
      <Page.Content>
        <MaterialTable />
      </Page.Content>
    </Page>
  )
}

const ch = createColumnHelper<MaterialDto>()

const columns = [
  ch.accessor('name', {
    header: 'Bahan Baku',
    cell: ({ row }) => row.original.name,
    enableSorting: false,
  }),
  ch.accessor('description', {
    header: 'Deskripsi',
    cell: ({ row }) => row.original.description ?? '-',
    enableSorting: false,
  }),
  ch.accessor('type', {
    header: 'Jenis',
    cell: ({ row }) => <BadgeDot {...MaterialBadgeProps[row.original.type]} />,
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
            nativeButton={false}
            render={
              <Link
                from={Route.fullPath}
                to='/materials/$id'
                params={{ id: String(row.original.id) }}
              />
            }
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

function MaterialTable() {
  const ds = useDataTableState()
  const { data, isLoading } = useQuery(
    materialApi.list.query({
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
      title='Daftar Bahan Baku'
      table={table}
      isLoading={isLoading}
      recordCount={data?.meta.total || 0}
      action={
        <Button
          size='sm'
          nativeButton={false}
          render={<Link from={Route.fullPath} to='/materials/create' />}
        >
          Tambah Bahan Baku
        </Button>
      }
    />
  )
}
