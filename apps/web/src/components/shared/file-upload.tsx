import { useRef, useState } from 'react'

import { FileIcon, UploadIcon, XIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import { IconTile } from '@/components/reui/icon-tile'

import {
	Attachment,
	AttachmentAction,
	AttachmentActions,
	AttachmentContent,
	AttachmentDescription,
	AttachmentMedia,
	AttachmentTitle,
} from '@/components/ui/attachment'
import { Spinner } from '@/components/ui/spinner'

export interface FileUploadItem {
	id: string
	name: string
	/** Bytes. Shown formatted (KB/MB) unless `error` is set. */
	size: number
	/** 0\u2013100. Omit once the upload is done. */
	progress?: number
	/** Shown in place of the size, and switches the row to the error treatment. */
	error?: string
}

interface FileUploadProps {
	items: FileUploadItem[]
	/** Caller owns the actual upload \u2014 this just hands back the raw picked/dropped files. */
	onFilesSelected: (files: File[]) => void
	onRemove?: (id: string) => void
	accept?: string
	multiple?: boolean
	disabled?: boolean
	/** Hint text under the dropzone label, e.g. "PDF, PNG up to 10MB". */
	description?: string
	className?: string
}

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Drag-and-drop + click-to-browse file picker, with the picked/uploading
 * files listed below as `Attachment` rows (progress spinner, error, remove).
 * Presentation only \u2014 the caller owns the actual upload request and the
 * `items` list (e.g. one entry per in-flight `useMutation`, updated as each
 * resolves). Pair with `Attachment` (`components/ui/attachment.tsx`) states
 * directly if a page needs a different layout than this dropzone + list.
 */
export function FileUpload({
	items,
	onFilesSelected,
	onRemove,
	accept,
	multiple = true,
	disabled = false,
	description,
	className,
}: FileUploadProps) {
	const [isDragOver, setIsDragOver] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)

	const handleFiles = (fileList: FileList | null) => {
		if (!fileList || fileList.length === 0) return
		onFilesSelected(Array.from(fileList))
	}

	return (
		<div className={cn('space-y-3', className)}>
			<div
				role="button"
				tabIndex={disabled ? -1 : 0}
				aria-disabled={disabled}
				onClick={() => !disabled && inputRef.current?.click()}
				onKeyDown={(e) => {
					if (disabled) return
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault()
						inputRef.current?.click()
					}
				}}
				onDragOver={(e) => {
					e.preventDefault()
					if (!disabled) setIsDragOver(true)
				}}
				onDragLeave={() => setIsDragOver(false)}
				onDrop={(e) => {
					e.preventDefault()
					setIsDragOver(false)
					if (!disabled) handleFiles(e.dataTransfer.files)
				}}
				className={cn(
					'flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed px-4 py-8 text-center outline-none transition-colors',
					disabled
						? 'cursor-not-allowed opacity-50'
						: 'cursor-pointer hover:border-foreground/25 hover:bg-muted/30 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30',
					isDragOver && 'border-primary bg-primary/5',
				)}
			>
				<IconTile variant="soft" size="sm">
					<UploadIcon />
				</IconTile>
				<p className="text-sm font-medium">
					<span className="text-primary">Click to upload</span> or drag and drop
				</p>
				{description && <p className="text-xs text-muted-foreground">{description}</p>}
				<input
					ref={inputRef}
					type="file"
					accept={accept}
					multiple={multiple}
					disabled={disabled}
					className="sr-only"
					onChange={(e) => {
						handleFiles(e.target.files)
						e.target.value = ''
					}}
				/>
			</div>

			{items.length > 0 && (
				<div className="space-y-2">
					{items.map((item) => {
						const isUploading = item.progress !== undefined && item.progress < 100
						return (
							<Attachment
								key={item.id}
								state={item.error ? 'error' : isUploading ? 'uploading' : 'done'}
							>
								<AttachmentMedia>
									{isUploading ? <Spinner className="size-4" /> : <FileIcon />}
								</AttachmentMedia>
								<AttachmentContent>
									<AttachmentTitle>{item.name}</AttachmentTitle>
									<AttachmentDescription>
										{item.error ??
											(isUploading ? `Uploading\u2026 ${item.progress}%` : formatBytes(item.size))}
									</AttachmentDescription>
								</AttachmentContent>
								{onRemove && (
									<AttachmentActions>
										<AttachmentAction
											aria-label={`Remove ${item.name}`}
											onClick={() => onRemove(item.id)}
										>
											<XIcon />
										</AttachmentAction>
									</AttachmentActions>
								)}
							</Attachment>
						)
					})}
				</div>
			)}
		</div>
	)
}
