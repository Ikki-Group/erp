import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'

import { useDataTable } from '@/hooks/use-data-table'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { Page } from '@/components/layout/page'
import { customColumn, textColumn } from '@/components/reui/data-grid/data-grid-columns'

import { Card } from '@/components/ui/card'

import { financeReportApi } from '@/features/reporting'
import type { FinanceReportRequestDto, AccountBalanceDto } from '@/features/reporting'
import { ReportDateFilter, useReportDateRange } from '@/features/reporting/components'

export const Route = createFileRoute('/_app/reports/finance/account-balances')({
	component: FinanceAccountBalancesReport,
})

const ch = createColumnHelper<AccountBalanceDto>()
const columns = [
	ch.accessor('accountCode', textColumn({ header: 'Kode', size: 120 })),
	ch.accessor('accountName', textColumn({ header: 'Nama Akun', size: 250 })),
	ch.accessor(
		'balance',
		customColumn({
			header: 'Saldo',
			cell: (v) => (
				<span
					className={`font-mono font-medium tabular-nums ${Number(v) < 0 ? 'text-rose-600' : 'text-foreground'}`}
				>
					Rp {Number(v).toLocaleString('id-ID')}
				</span>
			),
			size: 180,
		}),
	),
]

function FinanceAccountBalancesReport() {
	const [filter, setFilter] = useReportDateRange()

	const { data, isLoading } = useQuery(
		financeReportApi.accountBalances.query(filter as FinanceReportRequestDto),
	)

	const accounts: AccountBalanceDto[] = data?.data?.data ?? []

	const table = useDataTable({
		columns,
		data: accounts,
		pageCount: 1,
		rowCount: accounts.length,
		ds: { pagination: { limit: 50, page: 1 }, search: '', filters: {} } as any,
	})

	return (
		<Page>
			<Page.BlockHeader title="Saldo Akun" description="Daftar saldo seluruh akun buku besar." />
			<Page.Content className="space-y-6">
				<Card>
					<Card.Content className="pt-6">
						<ReportDateFilter value={filter} onChange={setFilter} showGroupBy={false} />
					</Card.Content>
				</Card>

				<DataTableCard
					title="Daftar Saldo Akun"
					table={table as any}
					isLoading={isLoading}
					recordCount={accounts.length}
				/>
			</Page.Content>
		</Page>
	)
}
