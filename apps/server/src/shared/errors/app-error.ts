export type ErrorMeta = Record<string, unknown>

export interface AppErrorOptions {
	code?: string
	meta?: ErrorMeta | undefined
	cause?: unknown
}

export abstract class AppError extends Error {
	public readonly code: string
	public readonly meta: ErrorMeta | undefined

	protected constructor(message: string, options?: AppErrorOptions) {
		super(message, {
			cause: options?.cause,
		})

		this.name = new.target.name
		this.code = options?.code ?? 'APP_ERROR'
		this.meta = options?.meta

		Error.captureStackTrace?.(this, new.target)
	}

	toJSON() {
		return {
			code: this.code,
			message: this.message,
			meta: this.meta,
		}
	}
}
