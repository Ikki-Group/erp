import { AppError } from './app-error'

export function normalizeError(error: unknown) {
	if (error instanceof AppError) {
		return {
			statusCode: 'statusCode' in error ? error.statusCode : 500,

			body: {
				code: error.code,
				message: error.message,
			},
		}
	}

	return {
		statusCode: 500,
		body: {
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Internal server error',
		},
	}
}
