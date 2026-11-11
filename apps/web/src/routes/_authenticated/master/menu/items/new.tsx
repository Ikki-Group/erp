import { createFileRoute } from '@tanstack/react-router'

import { MenuItemEditorPage } from '@/features/menu/components/menu-item-editor-page.tsx'

export const Route = createFileRoute('/_authenticated/master/menu/items/new')({
	component: MenuItemEditorPage,
})
