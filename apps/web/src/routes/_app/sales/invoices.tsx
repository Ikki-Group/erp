import { useCallback, useMemo } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

import { FileTextIcon, PrinterIcon } from 'lucide-react'
import { toast } from 'sonner'

import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

import { toDateTimeStamp } from '@/lib/formatter'
import { toastLabelMessage } from '@/lib/toast-message'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { BadgeDot } from '@/components/blocks/data-display/badge-dot'
import { ConfirmDialog } from '@/components/blocks/feedback/confirm-dialog'
import { Page } from '@/components/layout/page'
import { CellMenu, type CellMenuItem } from '@/components/reui/data-grid/data-grid-cell'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'

import { salesOrderApi } from '@/features/sales'
import type { SalesOrderDto } from '@/features/sales'

export const Route = createFileRoute('/_app/sales/invoices')({ component: SalesInvoices })

const ch = createColumnHelper<SalesOrderDto>()

function getColumns(
	onPrint: (o: SalesOrderDto) => void,
	onVoid: (o: SalesOrderDto) => Promise<void>,
): ColumnDef<SalesOrderDto>[] {
	return [
		ch.accessor('id', {
			header: 'No. Invoice',
			size: 130,
			cell: ({ row }) => (
				<span className="font-medium font-mono">
					INV-{String(row.original.id).padStart(5, '0')}
				</span>
			),
		}),
		ch.accessor('customerId', {
			header: 'Pelanggan',
			size: 200,
			cell: ({ row }) => (
				<span className="text-muted-foreground">
					{row.original.customerId ? (
						`Customer #${row.original.customerId}`
					) : (
						<span className="italic">Walk-in</span>
					)}
				</span>
			),
		}),
		ch.accessor('transactionDate', {
			header: 'Tanggal',
			size: 170,
			cell: ({ row }) => toDateTimeStamp(row.original.transactionDate.toISOString()),
		}),
		ch.accessor('totalAmount', {
			header: 'Total',
			size: 150,
			cell: ({ row }) => (
				<span className="font-medium text-right block tabular-nums">
					Rp {row.original.totalAmount.toLocaleString('id-ID')}
				</span>
			),
		}),
		ch.accessor('status', {
			header: 'Status',
			size: 130,
			cell: ({ row }) => {
				const status = row.original.status
				if (status === 'closed') return <BadgeDot variant="success">Lunas</BadgeDot>
				if (status === 'open') return <BadgeDot variant="warning">Belum Lunas</BadgeDot>
				return <BadgeDot variant="destructive">Batal</BadgeDot>
			},
		}),
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
						label: 'Cetak Invoice',
						icon: <PrinterIcon className="size-4" />,
						onClick: () => onPrint(row.original),
					},
				]
				if (row.original.status === 'open') {
					items.push({ type: 'separator' })
					items.push({
						type: 'button',
						label: 'Batalkan',
						variant: 'destructive',
						icon: <FileTextIcon className="size-4" />,
						onClick: () => onVoid(row.original),
					})
				}
				return <CellMenu items={items} label={`Aksi Invoice ${row.original.id}`} />
			},
		}),
	]
}

function SalesInvoices() {
	const ds = useDataTableState()
	const { data: ordersData, isLoading } = useQuery(
		salesOrderApi.list.query({ ...ds.pagination, ...ds.filters, q: ds.search }),
	)

	const voidMutation = useMutation({ mutationFn: salesOrderApi.void.mutationFn })

	const handleVoid = useCallback(
		async (order: SalesOrderDto) => {
			await ConfirmDialog.call({
				title: 'Batalkan Invoice',
				description: `Apakah Anda yakin ingin membatalkan invoice INV-${String(order.id).padStart(5, '0')}?`,
				variant: 'destructive',
				confirmLabel: 'Batalkan',
				confirmValidationText: `INV-${String(order.id).padStart(5, '0')}`,
				onConfirm: async () => {
					const promise = voidMutation.mutateAsync({
						params: { id: order.id },
						body: { reason: 'Dibatalkan via sistem' },
					})
					await toast.promise(promise, toastLabelMessage('update', 'invoice')).unwrap()
				},
			})
		},
		[voidMutation],
	)

	const handlePrint = useCallback((order: SalesOrderDto) => {
		toast.info(
			`Cetak invoice INV-${String(order.id).padStart(5, '0')} (fitur print belum tersedia)`,
		)
	}, [])

	const columns = useMemo(() => getColumns(handlePrint, handleVoid), [handlePrint, handleVoid])

	const table = useDataTable({
		columns,
		data: ordersData?.data ?? [],
		pageCount: ordersData?.meta.totalPages ?? 0,
		rowCount: ordersData?.meta.total ?? 0,
		ds,
	})

	return (
		<Page size="xl">
			<Page.BlockHeader
				title="Invoice & Surat Jalan"
				description="Kelola invoice penjualan dan dokumen pengiriman barang."
			/>
			<Page.Content>
				<DataTableCard
					title="Daftar Invoice"
					table={table}
					isLoading={isLoading}
					recordCount={ordersData?.meta.total ?? 0}
					toolbar={
						<DataGridFilter
							ds={ds}
							options={[
								{ type: 'search', placeholder: 'Cari nomor invoice...' },
								{
									type: 'select',
									key: 'status',
									placeholder: 'Semua Status',
									options: [
										{ label: 'Lunas', value: 'closed' },
										{ label: 'Belum Lunas', value: 'open' },
										{ label: 'Batal', value: 'void' },
									],
								},
							]}
						/>
					}
				/>
			</Page.Content>
		</Page>
	)
}
