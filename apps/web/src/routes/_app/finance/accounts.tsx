import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'

import { PlusIcon } from 'lucide-react'

import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { BadgeDot } from '@/components/blocks/data-display/badge-dot'
import { Page } from '@/components/layout/page'
import { customColumn, textColumn } from '@/components/reui/data-grid/data-grid-columns'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'

import { Button } from '@/components/ui/button'

import { accountApi } from '@/features/finance'
import type { AccountDto } from '@/features/finance'

export const Route = createFileRoute('/_app/finance/accounts')({ component: FinanceAccountsPage })

const ch = createColumnHelper<AccountDto>()

const columns = [
	ch.accessor('code', textColumn({ header: 'Kode Akun', size: 120 })),
	ch.accessor('name', textColumn({ header: 'Nama Akun', size: 250 })),
	ch.accessor(
		'type',
		customColumn({
			header: 'Kategori',
			cell: (value: string) => {
				if (value === 'ASSET') return <BadgeDot variant="success-outline">Aset</BadgeDot>
				if (value === 'LIABILITY')
					return <BadgeDot variant="destructive-outline">Kewajiban</BadgeDot>
				if (value === 'EQUITY') return <BadgeDot variant="primary-outline">Ekuitas</BadgeDot>
				if (value === 'REVENUE') return <BadgeDot variant="success">Pendapatan</BadgeDot>
				return <BadgeDot variant="warning-outline">Beban</BadgeDot>
			},
			size: 150,
		}),
	),
	ch.accessor(
		'isGroup',
		customColumn({
			header: 'Tipe',
			cell: (value: boolean) =>
				value ? (
					<BadgeDot variant="secondary">Grup</BadgeDot>
				) : (
					<BadgeDot variant="default">Detail</BadgeDot>
				),
			size: 100,
		}),
	),
]

function FinanceAccountsPage() {
	const ds = useDataTableState()
	const { data: accountsData, isLoading } = useQuery(
		accountApi.list.query({ ...ds.pagination, q: ds.search }),
	)

	const accounts = accountsData?.data ?? []
	const rowCount = accountsData?.meta?.total ?? 0

	const table = useDataTable({
		columns,
		data: accounts,
		pageCount: Math.ceil(rowCount / ds.pagination.limit),
		rowCount,
		ds,
	})

	return (
		<Page size="xl">
			<Page.BlockHeader
				title="Daftar Akun (Chart of Accounts)"
				description="Kelola hierarki akun Kas, Bank, Aset, hingga Biaya Operasional untuk pembukuan."
			/>
			<Page.Content>
				<DataTableCard
					title="Daftar Buku Akun"
					table={table as any}
					isLoading={isLoading}
					recordCount={rowCount}
					toolbar={
						<DataGridFilter
							ds={ds}
							options={[{ type: 'search', placeholder: 'Cari nama atau kode akun...' }]}
						/>
					}
					action={
						<Button size="sm" className="h-10 shadow-md font-medium">
							<PlusIcon className="size-4 mr-2" /> Tambah Akun Baru
						</Button>
					}
				/>
			</Page.Content>
		</Page>
	)
}
