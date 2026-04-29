import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/production/recipes')({
	component: ProductionRecipes,
})

function ProductionRecipes() {
	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-4">Resep & BOM</h1>
			<p className="text-muted-foreground">Halaman resep dan BOM akan ditampilkan di sini.</p>
		</div>
	)
}
