import { useRef, useState } from 'react'

import { toast } from '@/components/ui/toast'

import { confirm } from './confirm'

type Confirmation = Omit<Parameters<typeof confirm>[0], 'onConfirm'>

export interface WorkflowActionOptions<TEntity> {
	/** Presentation guard only. Authorization and entity constraints remain server-owned. */
	availability: (entity: TEntity) => boolean | string
	confirmation: (entity: TEntity) => Confirmation
	execute: (entity: TEntity) => Promise<unknown>
	successMessage: string | ((entity: TEntity) => string)
}

interface WorkflowActionEffects {
	confirm: (options: Confirmation & { onConfirm: () => Promise<void> }) => Promise<boolean>
	success: (message: string) => void
	onPendingChange?: (pending: boolean) => void
}

/** Owns one consequential interaction, including the open dialog and retryable execution. */
export function createWorkflowAction<TEntity>(
	getOptions: () => WorkflowActionOptions<TEntity>,
	effects: WorkflowActionEffects,
) {
	let pending = false
	return {
		get isPending() {
			return pending
		},
		async run(entity: TEntity): Promise<boolean> {
			if (pending || getOptions().availability(entity) !== true) return false
			pending = true
			effects.onPendingChange?.(true)
			let execution: Promise<void> | undefined
			let succeeded = false
			try {
				return await effects.confirm({
					...getOptions().confirmation(entity),
					onConfirm: () => {
						if (execution) return execution
						if (succeeded) return Promise.resolve()
						execution = Promise.resolve()
							.then(async () => {
								const options = getOptions()
								const available = options.availability(entity)
								if (available !== true) {
									throw new Error(
										typeof available === 'string'
											? available
											: 'This action is no longer available.',
									)
								}
								await options.execute(entity)
								succeeded = true
								effects.success(
									typeof options.successMessage === 'function'
										? options.successMessage(entity)
										: options.successMessage,
								)
								return undefined
							})
							.finally(() => {
								execution = undefined
							})
						return execution
					},
				})
			} finally {
				pending = false
				effects.onPendingChange?.(false)
			}
		},
	}
}

export function useWorkflowAction<TEntity>(options: WorkflowActionOptions<TEntity>) {
	const optionsRef = useRef(options)
	optionsRef.current = options
	const [isPending, setPending] = useState(false)
	const [action] = useState(() =>
		createWorkflowAction(() => optionsRef.current, {
			confirm,
			success: (title) => {
				toast.add({ title, type: 'success' })
			},
			onPendingChange: setPending,
		}),
	)
	return { run: action.run, isPending }
}
