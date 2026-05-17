export type ErrorContext = Record<string, unknown>

export interface AppErrorOptions {
	context?: ErrorContext | undefined
	cause?: unknown
}

export abstract class AppError extends Error {
	public readonly code: string
	public readonly context: ErrorContext | undefined

	protected constructor(message: string, code: string, options?: AppErrorOptions) {
		super(message, { cause: options?.cause })

		this.name = new.target.name
		this.code = code
		this.context = options?.context

		Error.captureStackTrace?.(this, new.target)
	}

	toJSON() {
		return {
			code: this.code,
			message: this.message,
			context: this.context,
		}
	}
}
