import { createFileRoute } from '@tanstack/react-router'
import { CheckIcon, CopyIcon, EyeIcon, TagIcon } from 'lucide-react'
import { useState } from 'react'

import { blocksPreviews } from '@/components/blocks/previews'
import { formPreviews } from '@/components/form/previews'
import { componentRegistry } from '@/components/registry'
import type { ComponentRegistryEntry } from '@/components/registry'

export const Route = createFileRoute('/_docs/docs/$layer')({ component: LayerPage })

/** Map layer name → preview map */
const previewMaps: Record<string, Record<string, ComponentRegistryEntry['preview']>> = {
	blocks: blocksPreviews,
	form: formPreviews,
}

function LayerPage() {
	const { layer } = Route.useParams()
	const registry = componentRegistry.find((r) => r.layer === layer)
	const previews = previewMaps[layer] ?? {}

	if (!registry) {
		return (
			<div className="p-8">
				<h1 className="text-2xl font-bold">Layer not found</h1>
				<p className="text-muted-foreground mt-2">
					No registry found for layer &ldquo;{layer}&rdquo;.
				</p>
			</div>
		)
	}

	return (
		<div className="p-8 max-w-4xl mx-auto">
			{/* Header */}
			<div className="space-y-2 mb-8 pb-6 border-b">
				<div className="flex items-center gap-2">
					<h1 className="text-3xl font-bold tracking-tight">{registry.title}</h1>
					{registry.readonly && (
						<span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
							Readonly
						</span>
					)}
				</div>
				<p className="text-muted-foreground">{registry.description}</p>
				<p className="text-sm text-muted-foreground">
					<span className="font-medium text-foreground">{registry.components.length}</span>{' '}
					registered components
				</p>
			</div>

			{/* Component Cards */}
			<div className="space-y-4">
				{registry.components.map((entry) => (
					<ComponentCard key={entry.name} entry={entry} preview={previews[entry.name]} />
				))}
			</div>
		</div>
	)
}

function ComponentCard({
	entry,
	preview,
}: {
	entry: ComponentRegistryEntry
	preview?: ComponentRegistryEntry['preview']
}) {
	const [copied, setCopied] = useState(false)

	const handleCopyImport = () => {
		const importStr = `import { ${entry.exports[0]} } from '${entry.importPath}'`
		navigator.clipboard.writeText(importStr)
		setCopied(true)
		setTimeout(() => {
			setCopied(false)
		}, 2000)
	}

	return (
		<div className="rounded-xl border bg-card overflow-hidden">
			{/* Card Header */}
			<div className="px-5 py-4 border-b bg-muted/20">
				<div className="flex items-start justify-between gap-4">
					<div>
						<h3 className="font-semibold text-base">{entry.name}</h3>
						<p className="text-sm text-muted-foreground mt-0.5">{entry.description}</p>
					</div>
				</div>
			</div>

			{/* Preview */}
			{preview && (
				<div className="px-5 py-4 border-b">
					<div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
						<EyeIcon className="size-3.5" />
						Preview
					</div>
					<div className="rounded-lg border border-dashed bg-background p-4">{preview()}</div>
				</div>
			)}

			{/* Card Body */}
			<div className="px-5 py-4 space-y-4">
				{/* Usage */}
				<div>
					<h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
						Kapan &amp; Bagaimana Menggunakan
					</h4>
					<p className="text-sm leading-relaxed">{entry.usage}</p>
				</div>

				{/* Import Path */}
				<div>
					<h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
						Import
					</h4>
					<div className="flex items-center gap-2">
						<code className="flex-1 bg-muted/50 text-sm px-3 py-2 rounded-lg font-mono truncate">
							{entry.importPath}
						</code>
						<button
							type="button"
							onClick={handleCopyImport}
							className="shrink-0 flex items-center justify-center size-8 rounded-md border hover:bg-accent transition-colors"
							title="Copy import statement"
						>
							{copied ? (
								<CheckIcon className="size-3.5 text-green-500" />
							) : (
								<CopyIcon className="size-3.5" />
							)}
						</button>
					</div>
				</div>

				{/* Exports */}
				<div>
					<h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
						Exports
					</h4>
					<div className="flex flex-wrap gap-1.5">
						{entry.exports.map((exp) => (
							<code
								key={exp}
								className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-md font-mono"
							>
								{exp}
							</code>
						))}
					</div>
				</div>

				{/* Tags */}
				<div>
					<h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
						Tags
					</h4>
					<div className="flex flex-wrap gap-1.5">
						{entry.tags.map((tag) => (
							<span
								key={tag}
								className="inline-flex items-center gap-1 bg-muted text-muted-foreground text-[11px] px-2 py-0.5 rounded-full"
							>
								<TagIcon className="size-2.5" />
								{tag}
							</span>
						))}
					</div>
				</div>
			</div>
		</div>
	)
}
