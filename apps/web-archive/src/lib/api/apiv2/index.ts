export { ApiError } from './core/errors'
export type { ApiErrorDetails } from './core/errors'

export { buildSearchParams, request } from './core/http'
export type { RequestOptions } from './core/http'

export { validateOrThrow } from './core/validate'
export type { ValidationTarget } from './core/validate'

export { createQueryKeys } from './core/query-keys'

export type { HttpMethod, Input, MutationMethod, Output, QueryKey } from './core/types'

export { defineEndpoint } from './define-endpoint'
export type {
	MutationEndpoint,
	MutationEndpointConfig,
	QueryEndpoint,
	QueryEndpointConfig,
} from './define-endpoint'

export { defineResource } from './define-resource'
export type { DefineResourceConfig, ResourceUrls } from './define-resource'
