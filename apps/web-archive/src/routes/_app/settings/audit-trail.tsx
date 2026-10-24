import { useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { Page } from '@/components/layout/page'

import { auditLogApi } from '@/features/audit'
import { AuditLogFilters } from '@/features/audit/components/audit-log-filters'
import { auditLogColumns } from '@/features/audit/components/audit-log-table-columns'
import type { AuditLogFilterDto } from '@/features/audit/dto'

export const Route = createFileRoute('/_app/settings/audit-trail')({
	component: SettingsAuditTrail,
})

function SettingsAuditTrail() {
	const ds = useDataTableState()
	const [filter, setFilter] = useState<AuditLogFilterDto>({
		...ds.pagination,
		q: ds.search,
	})

	const { data, isLoading } = useQuery({
		...auditLogApi.list.query(filter),
	})

	const auditLogs = data?.data ?? []
	const rowCount = data?.meta?.total ?? 0

	const table = useDataTable({
		columns: auditLogColumns as ColumnDef<unknown>[],
		data: auditLogs,
		pageCount: data?.meta?.totalPages ?? 0,
		rowCount,
		ds,
	})

	return (
		<Page>
			<Page.BlockHeader
				title="Audit Trail"
				description="Riwayat aktivitas dan perubahan data dalam sistem."
			/>
			<Page.Content>
				<DataTableCard
					title="Audit Logs"
					table={table as any}
					isLoading={isLoading}
					recordCount={rowCount}
					toolbar={<AuditLogFilters filter={filter} onFilterChange={setFilter} />}
				/>
			</Page.Content>
		</Page>
	)
}
