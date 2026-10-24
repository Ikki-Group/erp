import { useCallback } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createColumnHelper } from '@tanstack/react-table'

import { PlusIcon } from 'lucide-react'
import { toast } from 'sonner'

import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

import { toastLabelMessage } from '@/lib/toast-message'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { ConfirmDialog } from '@/components/blocks/feedback/confirm-dialog'
import { Page } from '@/components/layout/page'
import { CellMenu, type CellMenuItem } from '@/components/reui/data-grid/data-grid-cell'
import { customColumn, textColumn } from '@/components/reui/data-grid/data-grid-columns'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'

import { Button } from '@/components/ui/button'

import { supplierApi } from '../api'
import { SupplierFormDialog } from '../components/supplier-form-dialog'
import type { SupplierDto } from '../dto'

const ch = createColumnHelper<SupplierDto>()

export function SuppliersPage() {
	const ds = useDataTableState()
	const { data: suppliersData, isLoading } = useQuery(
		supplierApi.list.query({ ...ds.pagination, q: ds.search }),
	)

	const suppliers = suppliersData?.data ?? []
	const rowCount = suppliersData?.meta?.total ?? 0

	const deleteMutation = useMutation({ mutationFn: supplierApi.remove.mutationFn })

	const handleDelete = useCallback(
		async (supplier: SupplierDto) => {
			await ConfirmDialog.call({
				title: 'Hapus Supplier',
				description: `Apakah Anda yakin ingin menghapus supplier ${supplier.name}? Tindakan ini tidak dapat dibatalkan.`,
				variant: 'destructive',
				confirmLabel: 'Hapus',
				onConfirm: async () => {
					const promise = deleteMutation.mutateAsync({ params: { id: supplier.id } })
					await toast.promise(promise, toastLabelMessage('delete', 'supplier')).unwrap()
				},
			})
		},
		[deleteMutation],
	)

	const columns = [
		ch.accessor('id', textColumn({ header: 'ID', size: 80 })),
		ch.accessor('name', textColumn({ header: 'Nama Supplier', size: 200 })),
		ch.accessor('email', textColumn({ header: 'Email', size: 200 })),
		ch.accessor('phone', textColumn({ header: 'Telepon', size: 150 })),
		ch.accessor('address', textColumn({ header: 'Alamat', size: 200 })),
		ch.display({
			id: 'action',
			header: '',
			size: 60,
			enableSorting: false,
			enableHiding: false,
			cell: ({ row }) => {
				const items: CellMenuItem[] = [
					{
						type: 'button',
						label: 'Edit',
						onClick: () => {
							toast.info('Fitur edit belum tersedia')
						},
					},
					{
						type: 'separator',
					},
					{
						type: 'button',
						label: 'Hapus',
						variant: 'destructive',
						onClick: () => handleDelete(row.original),
					},
				]
				return <CellMenu items={items} label={`Aksi Supplier ${row.original.id}`} />
			},
		}),
	]

	const table = useDataTable({
		columns,
		data: suppliers,
		pageCount: suppliersData?.meta.totalPages ?? 0,
		rowCount,
		ds,
	})

	return (
		<Page size="xl">
			<Page.BlockHeader
				title="Daftar Supplier"
				description="Kelola informasi supplier atau vendor untuk pembelian bahan baku dan produk."
			/>
			<Page.Content>
				<DataTableCard
					title="Supplier"
					table={table as any}
					isLoading={isLoading}
					recordCount={rowCount}
					toolbar={
						<DataGridFilter
							ds={ds}
							options={[{ type: 'search', placeholder: 'Cari nama supplier...' }]}
						/>
					}
					action={
						<SupplierFormDialog>
							<Button>
								<PlusIcon className="mr-2 h-4 w-4" />
								Tambah Supplier
							</Button>
						</SupplierFormDialog>
					}
				/>
			</Page.Content>
		</Page>
	)
}
