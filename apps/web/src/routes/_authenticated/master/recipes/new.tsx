import { createFileRoute } from '@tanstack/react-router'

import { RecipeEditorPage } from '@/features/recipe/components/recipe-editor-page.tsx'

export const Route = createFileRoute('/_authenticated/master/recipes/new')({
	component: RecipeEditorPage,
})
