import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { ShieldCheckIcon, UserIcon } from 'lucide-react'
import { z } from 'zod'

import { listSearchSchema } from '@/components/data-table'
import { PageHeader } from '@/components/shared'
import { PageTabs, pageTabPanelId } from '@/components/shared/page-tabs'
import type { PageTab } from '@/components/shared/page-tabs'

import { roleResource, userResource } from '@/features/iam/api.ts'
import { RolesList } from '@/features/iam/components/roles-list.tsx'
import { UsersList } from '@/features/iam/components/users-list.tsx'

// Combine all search params for both tabs
const searchSchema = listSearchSchema.extend({
	tab: z.enum(['users', 'roles']).default('users'),
	// Users filters
	isActive: z.coerce.number().int().min(0).max(1).optional(),
	// Roles filters
	isSystem: z.coerce.number().int().min(0).max(1).optional(),
})

export const Route = createFileRoute('/_authenticated/settings/access-control')({
	validateSearch: searchSchema,
	component: AccessControlPage,
})

function AccessControlPage() {
	const navigate = useNavigate({ from: Route.fullPath })
	const search = Route.useSearch()
	const { tab } = search

	// Stats for both tabs
	const usersQuery = useQuery({
		...userResource.list.queryOptions({ page: 1, limit: 1 }),
		throwOnError: false,
	})
	const rolesQuery = useQuery({
		...roleResource.list.queryOptions({ page: 1, limit: 1 }),
		throwOnError: false,
	})

	const totalUsers = usersQuery.data?.meta?.total
	const totalRoles = rolesQuery.data?.meta?.total

	const handleTabChange = (tabId: string) => {
		// Preserve common filters (search query) when switching tabs
		// Reset only tab-specific filters
		navigate({
			search: {
				tab: tabId as 'users' | 'roles',
				page: 1,
				pageSize: search.pageSize,
				q: search.q, // Preserve search across tabs
				sort: search.sort,
			},
			replace: true,
		})
	}

	// Totals only feed the tab counters. They used to render as two big stat
	// tiles, which duplicated the counters and left a half-empty band above the
	// tabs — the tabs alone say how much is here.
	const tabs: PageTab[] = useMemo(
		() => [
			{
				id: 'users',
				label: 'Pengguna',
				icon: <UserIcon className="size-3.5" />,
				count: totalUsers,
			},
			{
				id: 'roles',
				label: 'Peran',
				icon: <ShieldCheckIcon className="size-3.5" />,
				count: totalRoles,
			},
		],
		[totalUsers, totalRoles],
	)

	return (
		<div className="space-y-6">
			<PageHeader
				title="Kontrol Akses"
				description="Kelola pengguna dan peran untuk kontrol akses."
			/>

			<PageTabs tabs={tabs} activeTab={tab} onTabChange={handleTabChange} />

			<div role="tabpanel" id={pageTabPanelId(tab)} aria-labelledby={`tab-${tab}`}>
				{tab === 'users' && <UsersList searchParams={search} />}
				{tab === 'roles' && <RolesList searchParams={search} />}
			</div>
		</div>
	)
}
