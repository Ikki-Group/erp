import React from 'react'

import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { Page } from '@/components/layout/page'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'

import { auditLogApi } from '@/features/audit'
import type { AuditLogFilterDto } from '@/features/audit'
import { AuditLogFilters } from '@/features/audit/components/audit-log-filters'
import { auditLogColumns } from '@/features/audit/components/audit-log-table-columns'

export const Route = createFileRoute('/_app/settings/audit-trail')({
	component: SettingsAuditTrail,
})

const defaultFilter: AuditLogFilterDto = {
	page: 1,
	limit: 20,
}

function SettingsAuditTrail() {
	const [filter, setFilter] = React.useState<AuditLogFilterDto>(defaultFilter)

	const { data, isLoading } = useQuery({
		...auditLogApi.list.query(filter),
	})

	return (
		<Page>
			<Page.BlockHeader
				title="Audit Trail"
				description="Riwayat aktivitas dan perubahan data dalam sistem."
			/>
			<Page.Content>
				<DataTableCard
					columns={auditLogColumns}
					data={data?.data.items || []}
					total={data?.data.total || 0}
					page={filter.page || 1}
					limit={filter.limit || 20}
					onPageChange={(page) => setFilter({ ...filter, page })}
					onLimitChange={(limit) => setFilter({ ...filter, limit, page: 1 })}
					isLoading={isLoading}
					filterSlot={
						<DataGridFilter>
							<AuditLogFilters filter={filter} onFilterChange={setFilter} />
						</DataGridFilter>
					}
				/>
			</Page.Content>
		</Page>
	)
}
