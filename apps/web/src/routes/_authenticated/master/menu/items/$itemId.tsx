import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { DetailBoundary } from '@/components/shared/detail-boundary.tsx'

import { menuItemExtras } from '@/features/menu/api.ts'
import { MenuItemEditorPage } from '@/features/menu/components/menu-item-editor-page.tsx'

export const Route = createFileRoute('/_authenticated/master/menu/items/$itemId')({
	component: EditMenuItemPage,
})

function EditMenuItemPage() {
	const { itemId } = Route.useParams()
	const query = useQuery(
		menuItemExtras.detail.queryOptions({ id: Number(itemId) }, { throwOnError: false }),
	)

	return (
		<DetailBoundary query={query}>
			{(response) => <MenuItemEditorPage key={response.data.id} item={response.data} />}
		</DetailBoundary>
	)
}
