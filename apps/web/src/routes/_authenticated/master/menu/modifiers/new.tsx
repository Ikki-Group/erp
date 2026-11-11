import { createFileRoute } from '@tanstack/react-router'

import { ModifierGroupEditorPage } from '@/features/menu/components/modifier-group-editor-page.tsx'

export const Route = createFileRoute('/_authenticated/master/menu/modifiers/new')({
	component: ModifierGroupEditorPage,
})
