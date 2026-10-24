import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { DetailBoundary } from '@/components/shared/detail-boundary.tsx'

import { recipeResource } from '@/features/recipe/api.ts'
import { RecipeEditorPage } from '@/features/recipe/components/recipe-editor-page.tsx'

export const Route = createFileRoute('/_authenticated/master/recipes/$recipeId')({
	component: EditRecipePage,
})

function EditRecipePage() {
	const { recipeId } = Route.useParams()
	const query = useQuery(
		recipeResource.detail.queryOptions({ id: Number(recipeId) }, { throwOnError: false }),
	)

	return (
		<DetailBoundary query={query}>
			{(response) => <RecipeEditorPage key={response.data.id} recipe={response.data} />}
		</DetailBoundary>
	)
}
