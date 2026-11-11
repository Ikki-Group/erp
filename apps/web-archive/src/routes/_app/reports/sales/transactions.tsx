import { useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { Page } from '@/components/layout/page'

import { salesOrderApi } from '@/features/sales/api'

export const Route = createFileRoute('/_app/reports/sales/transactions')({
	component: RouteComponent,
})

function RouteComponent() {
	const { data, isLoading } = useQuery(salesOrderApi.list.query({ page: 1, limit: 10 }))

	return (
		<Page size="xl">
			<Page.BlockHeader
				title="Transaksi Penjualan"
				description="Daftar semua transaksi penjualan."
			/>
			<Page.Content className="flex flex-col gap-6">
				<div className="p-4 border rounded-md">
					{isLoading ? <p>Loading...</p> : <pre>{JSON.stringify(data, null, 2)}</pre>}
				</div>
			</Page.Content>
		</Page>
	)
}
