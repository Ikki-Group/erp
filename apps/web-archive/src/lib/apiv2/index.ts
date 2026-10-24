export { httpClient } from './client'
export type { ApiClient } from './client'

export { ApiError, isApiError } from './errors'
export type { ApiErrorOptions, ApiErrorPayload } from './errors'

export { isSchemaValidationError, SchemaValidationError } from './schema-error'
export type { ValidationTarget } from './schema-error'

export { buildSearchParams, requestJson } from './http'
export type { RequestConfig } from './http'

export { parseOrThrow } from './validate'

export { createQueryKeys } from './query-keys'
export type { QueryKeys } from './query-keys'

export type { Args, EndpointKind, HttpMethod, Input, MaybeSchema, Output, QueryKey } from './types'

export { defineEndpoint, defineMutation, defineQuery } from './endpoint'
export type {
	InvalidateTarget,
	MutationEndpoint,
	MutationEndpointConfig,
	QueryEndpoint,
	QueryEndpointConfig,
} from './endpoint'

export { defineResource } from './resource'
export type { DefineResourceConfig, ResourceUrls } from './resource'
